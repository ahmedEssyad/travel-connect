import mongoose from 'mongoose';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';
import Notification from '@/models/Notification';

export class DatabaseOptimizer {
  /**
   * Create all necessary indexes for optimal query performance
   */
  static async createIndexes() {
    try {
      console.log('🔍 Creating database indexes...');

      // BloodRequest indexes
      await BloodRequest.collection.createIndex(
        { 'patientInfo.bloodType': 1, urgencyLevel: 1, status: 1, deadline: 1 },
        { name: 'blood_requests_search_idx' }
      );

      await BloodRequest.collection.createIndex(
        { 'hospital.coordinates': '2dsphere' },
        { name: 'blood_requests_geo_idx' }
      );

      await BloodRequest.collection.createIndex(
        { requesterId: 1, status: 1 },
        { name: 'blood_requests_requester_idx' }
      );

      await BloodRequest.collection.createIndex(
        { deadline: 1, status: 1 },
        { name: 'blood_requests_deadline_idx' }
      );

      await BloodRequest.collection.createIndex(
        { createdAt: 1 },
        { name: 'blood_requests_ttl_idx', expireAfterSeconds: 30 * 24 * 60 * 60 }
      );

      // User indexes
      await User.collection.createIndex(
        { phoneNumber: 1 },
        { name: 'users_phone_idx', unique: true }
      );

      await User.collection.createIndex(
        { bloodType: 1, 'medicalInfo.availableForDonation': 1, 'medicalInfo.isDonor': 1 },
        { name: 'users_donor_search_idx' }
      );

      await User.collection.createIndex(
        { 'notificationPreferences.urgencyLevels': 1 },
        { name: 'users_notification_prefs_idx' }
      );

      await User.collection.createIndex(
        { totalDonations: -1, 'medicalInfo.lastDonationDate': -1 },
        { name: 'users_donation_history_idx' }
      );

      // Notification indexes
      await Notification.collection.createIndex(
        { userId: 1, read: 1, createdAt: -1 },
        { name: 'notifications_user_idx' }
      );

      await Notification.collection.createIndex(
        { createdAt: 1 },
        { name: 'notifications_ttl_idx', expireAfterSeconds: 90 * 24 * 60 * 60 }
      );

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  static async analyzeQueryPerformance() {
    try {
      console.log('📊 Analyzing query performance...');

      const db = mongoose.connection.db;
      
      // Analyze BloodRequest queries
      const bloodRequestStats = await db.collection('bloodrequests').stats();
      console.log('BloodRequest collection stats:', {
        documents: bloodRequestStats.count,
        avgObjSize: Math.round(bloodRequestStats.avgObjSize),
        indexes: bloodRequestStats.nindexes,
        totalIndexSize: Math.round(bloodRequestStats.totalIndexSize / 1024) + ' KB'
      });

      // Analyze User queries
      const userStats = await db.collection('users').stats();
      console.log('User collection stats:', {
        documents: userStats.count,
        avgObjSize: Math.round(userStats.avgObjSize),
        indexes: userStats.nindexes,
        totalIndexSize: Math.round(userStats.totalIndexSize / 1024) + ' KB'
      });

      // Check slow queries (if profiling is enabled)
      const slowQueries = await db.collection('system.profile')
        .find({ ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort({ ts: -1 })
        .limit(10)
        .toArray();

      if (slowQueries.length > 0) {
        console.log('🐌 Recent slow queries found:', slowQueries.length);
      }

      return {
        bloodRequestStats,
        userStats,
        slowQueries: slowQueries.length
      };
    } catch (error) {
      console.error('❌ Error analyzing query performance:', error);
      return null;
    }
  }

  /**
   * Optimize specific queries with aggregation pipelines
   */
  static buildOptimizedQueries() {
    return {
      // Find compatible donors near a blood request
      findNearbyDonors: (bloodType: string, lat: number, lng: number, maxDistance = 50000) => {
        const compatibleTypes = this.getCompatibleBloodTypes(bloodType);
        
        return User.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [lng, lat] },
              distanceField: 'distance',
              maxDistance,
              spherical: true,
              query: {
                bloodType: { $in: compatibleTypes },
                'medicalInfo.isDonor': true,
                'medicalInfo.availableForDonation': true
              }
            }
          },
          {
            $addFields: {
              priority: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$bloodType', bloodType] }, then: 1 }, // Exact match
                    { case: { $eq: ['$bloodType', 'O-'] }, then: 2 }, // Universal donor
                    { case: { $in: ['$bloodType', ['O+', 'A-', 'B-']] }, then: 3 }
                  ],
                  default: 4
                }
              }
            }
          },
          {
            $sort: { priority: 1, distance: 1, totalDonations: -1 }
          },
          {
            $limit: 20
          },
          {
            $project: {
              _id: 1,
              name: 1,
              phoneNumber: 1,
              bloodType: 1,
              distance: 1,
              totalDonations: 1,
              'medicalInfo.lastDonationDate': 1,
              'notificationPreferences': 1
            }
          }
        ]);
      },

      // Find urgent blood requests for dashboard
      findUrgentRequests: () => {
        return BloodRequest.aggregate([
          {
            $match: {
              status: 'active',
              deadline: { $gte: new Date() }
            }
          },
          {
            $addFields: {
              urgencyScore: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$urgencyLevel', 'critical'] }, then: 3 },
                    { case: { $eq: ['$urgencyLevel', 'urgent'] }, then: 2 },
                    { case: { $eq: ['$urgencyLevel', 'standard'] }, then: 1 }
                  ],
                  default: 0
                }
              },
              timeRemaining: {
                $subtract: ['$deadline', new Date()]
              }
            }
          },
          {
            $sort: { urgencyScore: -1, timeRemaining: 1 }
          },
          {
            $limit: 10
          }
        ]);
      },

      // Get donor statistics
      getDonorStats: () => {
        return User.aggregate([
          {
            $match: {
              'medicalInfo.isDonor': true
            }
          },
          {
            $group: {
              _id: '$bloodType',
              count: { $sum: 1 },
              availableCount: {
                $sum: {
                  $cond: ['$medicalInfo.availableForDonation', 1, 0]
                }
              },
              totalDonations: { $sum: '$totalDonations' }
            }
          },
          {
            $sort: { count: -1 }
          }
        ]);
      }
    };
  }

  /**
   * Get compatible blood types for a given blood type
   */
  private static getCompatibleBloodTypes(bloodType: string): string[] {
    const compatibility: { [key: string]: string[] } = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };

    return compatibility[bloodType] || [bloodType];
  }

  /**
   * Clean up expired data
   */
  static async cleanupExpiredData() {
    try {
      console.log('🧹 Cleaning up expired data...');

      // Update expired blood requests
      const expiredRequests = await BloodRequest.updateMany(
        {
          status: 'active',
          deadline: { $lt: new Date() }
        },
        {
          $set: { status: 'expired' }
        }
      );

      // Remove old notifications (older than 90 days)
      const oldNotifications = await Notification.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        read: true
      });

      console.log(`✅ Cleanup completed: ${expiredRequests.modifiedCount} expired requests, ${oldNotifications.deletedCount} old notifications`);

      return {
        expiredRequests: expiredRequests.modifiedCount,
        removedNotifications: oldNotifications.deletedCount
      };
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }
}

// Export optimized query builders
export const OptimizedQueries = DatabaseOptimizer.buildOptimizedQueries();