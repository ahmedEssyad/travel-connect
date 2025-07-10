'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface Country {
  name: string;
  code: string;
  flag: string;
}

interface City {
  name: string;
  country: string;
  population: number;
  lat: number;
  lng: number;
}

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  showExactLocation?: boolean;
}

export default function LocationSelector({ 
  value, 
  onChange, 
  placeholder = "Select country and city",
  label = "Location",
  required = false,
  showExactLocation = false
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'country' | 'city' | 'exact'>('country');
  const [exactLocation, setExactLocation] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Parse existing value
  useEffect(() => {
    if (value && value.includes(',')) {
      const [cityName, countryName] = value.split(',').map(s => s.trim());
      setCitySearch(cityName);
      setCountrySearch(countryName);
      setStep('city');
      
      // Find country from the list
      const country = countries.find(c => 
        c.name.toLowerCase().includes(countryName.toLowerCase())
      );
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [value, countries]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCountries = async () => {
    // Comprehensive list of all countries
    const allCountries = [
      { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
      { name: 'Albania', code: 'AL', flag: '🇦🇱' },
      { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
      { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
      { name: 'Armenia', code: 'AM', flag: '🇦🇲' },
      { name: 'Australia', code: 'AU', flag: '🇦🇺' },
      { name: 'Austria', code: 'AT', flag: '🇦🇹' },
      { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
      { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
      { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
      { name: 'Belarus', code: 'BY', flag: '🇧🇾' },
      { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
      { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
      { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
      { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
      { name: 'Canada', code: 'CA', flag: '🇨🇦' },
      { name: 'Chile', code: 'CL', flag: '🇨🇱' },
      { name: 'China', code: 'CN', flag: '🇨🇳' },
      { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
      { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
      { name: 'Cyprus', code: 'CY', flag: '🇨🇾' },
      { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
      { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
      { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
      { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
      { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
      { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
      { name: 'Finland', code: 'FI', flag: '🇫🇮' },
      { name: 'France', code: 'FR', flag: '🇫🇷' },
      { name: 'Georgia', code: 'GE', flag: '🇬🇪' },
      { name: 'Germany', code: 'DE', flag: '🇩🇪' },
      { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
      { name: 'Greece', code: 'GR', flag: '🇬🇷' },
      { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
      { name: 'Iceland', code: 'IS', flag: '🇮🇸' },
      { name: 'India', code: 'IN', flag: '🇮🇳' },
      { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
      { name: 'Iran', code: 'IR', flag: '🇮🇷' },
      { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
      { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
      { name: 'Israel', code: 'IL', flag: '🇮🇱' },
      { name: 'Italy', code: 'IT', flag: '🇮🇹' },
      { name: 'Japan', code: 'JP', flag: '🇯🇵' },
      { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
      { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
      { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
      { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
      { name: 'Latvia', code: 'LV', flag: '🇱🇻' },
      { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
      { name: 'Lithuania', code: 'LT', flag: '🇱🇹' },
      { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
      { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
      { name: 'Malta', code: 'MT', flag: '🇲🇹' },
      { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
      { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
      { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
      { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
      { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
      { name: 'Norway', code: 'NO', flag: '🇳🇴' },
      { name: 'Oman', code: 'OM', flag: '🇴🇲' },
      { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
      { name: 'Peru', code: 'PE', flag: '🇵🇪' },
      { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
      { name: 'Poland', code: 'PL', flag: '🇵🇱' },
      { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
      { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
      { name: 'Romania', code: 'RO', flag: '🇷🇴' },
      { name: 'Russia', code: 'RU', flag: '🇷🇺' },
      { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
      { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
      { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
      { name: 'Slovakia', code: 'SK', flag: '🇸🇰' },
      { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
      { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
      { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
      { name: 'Spain', code: 'ES', flag: '🇪🇸' },
      { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
      { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
      { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
      { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
      { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
      { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
      { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
      { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
      { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
      { name: 'United States', code: 'US', flag: '🇺🇸' },
      { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
      { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
      { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
      { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
      { name: 'Yemen', code: 'YE', flag: '🇾🇪' },
    ].sort((a, b) => a.name.localeCompare(b.name));
    setCountries(allCountries);
  };

  const fetchCities = async (countryCode: string, searchTerm: string = '') => {
    if (!countryCode) return;
    
    setLoading(true);
    try {
      // Try REST Countries API first, then fallback to our data
      let cities = [];
      
      try {
        // Use a more comprehensive API approach
        const response = await fetch(`https://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=100&username=demo`);
        if (response.ok) {
          const data = await response.json();
          cities = data.geonames?.map((city: any) => ({
            name: city.name,
            country: city.countryName,
            population: city.population || 0,
            lat: city.lat,
            lng: city.lng
          })) || [];
        }
      } catch (apiError) {
        console.log('External API failed, using fallback data');
      }
      
      // Always merge with fallback data for better coverage
      const fallbackCities = getFallbackCities(countryCode);
      const allCities = [...cities, ...fallbackCities];
      
      // Remove duplicates based on city name
      const uniqueCities = allCities.filter((city, index, self) => 
        index === self.findIndex(c => c.name.toLowerCase() === city.name.toLowerCase())
      );
      
      // Sort by population (descending) then by name
      uniqueCities.sort((a, b) => {
        if (b.population !== a.population) {
          return b.population - a.population;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Filter based on search term if provided
      let filteredCities = uniqueCities;
      if (searchTerm && searchTerm.length > 0) {
        filteredCities = uniqueCities.filter(city =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setCities(filteredCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities(getFallbackCities(countryCode));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackCities = (countryCode: string): City[] => {
    const fallbackData: { [key: string]: City[] } = {
      'US': [
        { name: 'New York', country: 'United States', population: 8000000, lat: 40.7128, lng: -74.0060 },
        { name: 'Los Angeles', country: 'United States', population: 4000000, lat: 34.0522, lng: -118.2437 },
        { name: 'Chicago', country: 'United States', population: 2700000, lat: 41.8781, lng: -87.6298 },
        { name: 'Houston', country: 'United States', population: 2300000, lat: 29.7604, lng: -95.3698 },
        { name: 'Phoenix', country: 'United States', population: 1600000, lat: 33.4484, lng: -112.0740 },
        { name: 'Philadelphia', country: 'United States', population: 1500000, lat: 39.9526, lng: -75.1652 },
        { name: 'San Antonio', country: 'United States', population: 1400000, lat: 29.4241, lng: -98.4936 },
        { name: 'San Diego', country: 'United States', population: 1400000, lat: 32.7157, lng: -117.1611 },
        { name: 'Dallas', country: 'United States', population: 1300000, lat: 32.7767, lng: -96.7970 },
        { name: 'San Jose', country: 'United States', population: 1000000, lat: 37.3382, lng: -121.8863 },
      ],
      'GB': [
        { name: 'London', country: 'United Kingdom', population: 9000000, lat: 51.5074, lng: -0.1278 },
        { name: 'Manchester', country: 'United Kingdom', population: 550000, lat: 53.4808, lng: -2.2426 },
        { name: 'Birmingham', country: 'United Kingdom', population: 1100000, lat: 52.4862, lng: -1.8904 },
        { name: 'Leeds', country: 'United Kingdom', population: 500000, lat: 53.8008, lng: -1.5491 },
        { name: 'Glasgow', country: 'United Kingdom', population: 635000, lat: 55.8642, lng: -4.2518 },
        { name: 'Liverpool', country: 'United Kingdom', population: 500000, lat: 53.4084, lng: -2.9916 },
        { name: 'Edinburgh', country: 'United Kingdom', population: 530000, lat: 55.9533, lng: -3.1883 },
        { name: 'Bristol', country: 'United Kingdom', population: 467000, lat: 51.4545, lng: -2.5879 },
      ],
      'FR': [
        { name: 'Paris', country: 'France', population: 2200000, lat: 48.8566, lng: 2.3522 },
        { name: 'Lyon', country: 'France', population: 515000, lat: 45.7640, lng: 4.8357 },
        { name: 'Marseille', country: 'France', population: 870000, lat: 43.2965, lng: 5.3698 },
        { name: 'Toulouse', country: 'France', population: 479000, lat: 43.6047, lng: 1.4442 },
        { name: 'Nice', country: 'France', population: 340000, lat: 43.7102, lng: 7.2620 },
        { name: 'Nantes', country: 'France', population: 320000, lat: 47.2184, lng: -1.5536 },
      ],
      'DE': [
        { name: 'Berlin', country: 'Germany', population: 3700000, lat: 52.5200, lng: 13.4050 },
        { name: 'Hamburg', country: 'Germany', population: 1900000, lat: 53.5511, lng: 9.9937 },
        { name: 'Munich', country: 'Germany', population: 1500000, lat: 48.1351, lng: 11.5820 },
        { name: 'Cologne', country: 'Germany', population: 1100000, lat: 50.9375, lng: 6.9603 },
        { name: 'Frankfurt', country: 'Germany', population: 750000, lat: 50.1109, lng: 8.6821 },
      ],
      'ES': [
        { name: 'Madrid', country: 'Spain', population: 3200000, lat: 40.4168, lng: -3.7038 },
        { name: 'Barcelona', country: 'Spain', population: 1600000, lat: 41.3851, lng: 2.1734 },
        { name: 'Valencia', country: 'Spain', population: 800000, lat: 39.4699, lng: -0.3763 },
        { name: 'Seville', country: 'Spain', population: 690000, lat: 37.3891, lng: -5.9845 },
      ],
      'IT': [
        { name: 'Rome', country: 'Italy', population: 2870000, lat: 41.9028, lng: 12.4964 },
        { name: 'Milan', country: 'Italy', population: 1400000, lat: 45.4642, lng: 9.1900 },
        { name: 'Naples', country: 'Italy', population: 970000, lat: 40.8518, lng: 14.2681 },
        { name: 'Turin', country: 'Italy', population: 870000, lat: 45.0703, lng: 7.6869 },
      ],
      'CA': [
        { name: 'Toronto', country: 'Canada', population: 2930000, lat: 43.6532, lng: -79.3832 },
        { name: 'Montreal', country: 'Canada', population: 1780000, lat: 45.5017, lng: -73.5673 },
        { name: 'Vancouver', country: 'Canada', population: 675000, lat: 49.2827, lng: -123.1207 },
        { name: 'Calgary', country: 'Canada', population: 1340000, lat: 51.0447, lng: -114.0719 },
      ],
      'AU': [
        { name: 'Sydney', country: 'Australia', population: 5300000, lat: -33.8688, lng: 151.2093 },
        { name: 'Melbourne', country: 'Australia', population: 5100000, lat: -37.8136, lng: 144.9631 },
        { name: 'Brisbane', country: 'Australia', population: 2560000, lat: -27.4698, lng: 153.0251 },
        { name: 'Perth', country: 'Australia', population: 2140000, lat: -31.9505, lng: 115.8605 },
      ],
      'JP': [
        { name: 'Tokyo', country: 'Japan', population: 14000000, lat: 35.6762, lng: 139.6503 },
        { name: 'Osaka', country: 'Japan', population: 2700000, lat: 34.6937, lng: 135.5023 },
        { name: 'Kyoto', country: 'Japan', population: 1500000, lat: 35.0116, lng: 135.7681 },
        { name: 'Yokohama', country: 'Japan', population: 3700000, lat: 35.4437, lng: 139.6380 },
      ],
      'CN': [
        { name: 'Beijing', country: 'China', population: 21000000, lat: 39.9042, lng: 116.4074 },
        { name: 'Shanghai', country: 'China', population: 24000000, lat: 31.2304, lng: 121.4737 },
        { name: 'Guangzhou', country: 'China', population: 13000000, lat: 23.1291, lng: 113.2644 },
        { name: 'Shenzhen', country: 'China', population: 12000000, lat: 22.5431, lng: 114.0579 },
      ],
      'IN': [
        { name: 'Mumbai', country: 'India', population: 20000000, lat: 19.0760, lng: 72.8777 },
        { name: 'Delhi', country: 'India', population: 29000000, lat: 28.7041, lng: 77.1025 },
        { name: 'Bangalore', country: 'India', population: 12000000, lat: 12.9716, lng: 77.5946 },
        { name: 'Chennai', country: 'India', population: 10000000, lat: 13.0827, lng: 80.2707 },
      ],
      'BR': [
        { name: 'São Paulo', country: 'Brazil', population: 12000000, lat: -23.5558, lng: -46.6396 },
        { name: 'Rio de Janeiro', country: 'Brazil', population: 6700000, lat: -22.9068, lng: -43.1729 },
        { name: 'Brasília', country: 'Brazil', population: 3000000, lat: -15.8267, lng: -47.9218 },
        { name: 'Salvador', country: 'Brazil', population: 2900000, lat: -12.9714, lng: -38.5014 },
      ],
      'MX': [
        { name: 'Mexico City', country: 'Mexico', population: 9200000, lat: 19.4326, lng: -99.1332 },
        { name: 'Guadalajara', country: 'Mexico', population: 1600000, lat: 20.6597, lng: -103.3496 },
        { name: 'Monterrey', country: 'Mexico', population: 1100000, lat: 25.6866, lng: -100.3161 },
        { name: 'Cancún', country: 'Mexico', population: 900000, lat: 21.1619, lng: -86.8515 },
      ],
      'NL': [
        { name: 'Amsterdam', country: 'Netherlands', population: 900000, lat: 52.3676, lng: 4.9041 },
        { name: 'Rotterdam', country: 'Netherlands', population: 650000, lat: 51.9225, lng: 4.4792 },
        { name: 'The Hague', country: 'Netherlands', population: 550000, lat: 52.0705, lng: 4.3007 },
        { name: 'Utrecht', country: 'Netherlands', population: 360000, lat: 52.0907, lng: 5.1214 },
      ],
      'CH': [
        { name: 'Zurich', country: 'Switzerland', population: 400000, lat: 47.3769, lng: 8.5417 },
        { name: 'Geneva', country: 'Switzerland', population: 200000, lat: 46.2044, lng: 6.1432 },
        { name: 'Basel', country: 'Switzerland', population: 175000, lat: 47.5596, lng: 7.5886 },
        { name: 'Bern', country: 'Switzerland', population: 145000, lat: 46.9481, lng: 7.4474 },
        { name: 'Lausanne', country: 'Switzerland', population: 140000, lat: 46.5197, lng: 6.6323 },
        { name: 'Winterthur', country: 'Switzerland', population: 110000, lat: 47.5000, lng: 8.7500 },
        { name: 'Lucerne', country: 'Switzerland', population: 82000, lat: 47.0500, lng: 8.3000 },
        { name: 'St. Gallen', country: 'Switzerland', population: 76000, lat: 47.4245, lng: 9.3767 },
        { name: 'Lugano', country: 'Switzerland', population: 63000, lat: 46.0037, lng: 8.9511 },
        { name: 'Biel/Bienne', country: 'Switzerland', population: 55000, lat: 47.1333, lng: 7.2500 },
      ],
      'RU': [
        { name: 'Moscow', country: 'Russia', population: 12500000, lat: 55.7558, lng: 37.6173 },
        { name: 'St. Petersburg', country: 'Russia', population: 5400000, lat: 59.9311, lng: 30.3609 },
        { name: 'Novosibirsk', country: 'Russia', population: 1600000, lat: 55.0084, lng: 82.9357 },
        { name: 'Yekaterinburg', country: 'Russia', population: 1500000, lat: 56.8431, lng: 60.6454 },
        { name: 'Nizhny Novgorod', country: 'Russia', population: 1250000, lat: 56.2965, lng: 43.9361 },
        { name: 'Kazan', country: 'Russia', population: 1240000, lat: 55.8304, lng: 49.0661 },
        { name: 'Chelyabinsk', country: 'Russia', population: 1200000, lat: 55.1644, lng: 61.4368 },
        { name: 'Omsk', country: 'Russia', population: 1150000, lat: 54.9884, lng: 73.3242 },
        { name: 'Samara', country: 'Russia', population: 1140000, lat: 53.2001, lng: 50.1500 },
        { name: 'Rostov-on-Don', country: 'Russia', population: 1130000, lat: 47.2357, lng: 39.7015 },
        { name: 'Ufa', country: 'Russia', population: 1120000, lat: 54.7388, lng: 55.9721 },
        { name: 'Krasnoyarsk', country: 'Russia', population: 1090000, lat: 56.0184, lng: 92.8672 },
        { name: 'Perm', country: 'Russia', population: 1050000, lat: 58.0105, lng: 56.2502 },
        { name: 'Voronezh', country: 'Russia', population: 1050000, lat: 51.6720, lng: 39.1843 },
        { name: 'Volgograd', country: 'Russia', population: 1020000, lat: 48.7080, lng: 44.5133 },
      ],
      'TR': [
        { name: 'Istanbul', country: 'Turkey', population: 15500000, lat: 41.0082, lng: 28.9784 },
        { name: 'Ankara', country: 'Turkey', population: 5500000, lat: 39.9334, lng: 32.8597 },
        { name: 'Izmir', country: 'Turkey', population: 3000000, lat: 38.4237, lng: 27.1428 },
        { name: 'Bursa', country: 'Turkey', population: 2000000, lat: 40.1826, lng: 29.0665 },
        { name: 'Adana', country: 'Turkey', population: 1750000, lat: 37.0000, lng: 35.3213 },
        { name: 'Gaziantep', country: 'Turkey', population: 1650000, lat: 37.0662, lng: 37.3833 },
        { name: 'Konya', country: 'Turkey', population: 1390000, lat: 37.8667, lng: 32.4833 },
        { name: 'Antalya', country: 'Turkey', population: 1300000, lat: 36.8969, lng: 30.7133 },
        { name: 'Kayseri', country: 'Turkey', population: 1200000, lat: 38.7312, lng: 35.4787 },
        { name: 'Mersin', country: 'Turkey', population: 1040000, lat: 36.8000, lng: 34.6333 },
      ],
      'AE': [
        { name: 'Dubai', country: 'United Arab Emirates', population: 3400000, lat: 25.2048, lng: 55.2708 },
        { name: 'Abu Dhabi', country: 'United Arab Emirates', population: 1500000, lat: 24.4539, lng: 54.3773 },
        { name: 'Sharjah', country: 'United Arab Emirates', population: 1400000, lat: 25.3463, lng: 55.4209 },
        { name: 'Al Ain', country: 'United Arab Emirates', population: 650000, lat: 24.2075, lng: 55.7447 },
        { name: 'Ajman', country: 'United Arab Emirates', population: 490000, lat: 25.4052, lng: 55.5136 },
        { name: 'Ras Al Khaimah', country: 'United Arab Emirates', population: 400000, lat: 25.7889, lng: 55.9433 },
        { name: 'Fujairah', country: 'United Arab Emirates', population: 250000, lat: 25.1164, lng: 56.3269 },
      ],
    };
    
    return fallbackData[countryCode] || [];
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setCountrySearch(country.name);
    setShowCountryDropdown(false);
    setStep('city');
    setCitySearch('');
    setCities([]);
    fetchCities(country.code);
  };

  const handleCitySelect = (city: City) => {
    setCitySearch(city.name);
    setShowCityDropdown(false);
    if (showExactLocation) {
      setStep('exact');
      setExactLocation('');
    } else {
      onChange(`${city.name}, ${selectedCountry?.name}`);
    }
  };

  const handleCitySearchChange = (searchTerm: string) => {
    setCitySearch(searchTerm);
    if (selectedCountry) {
      fetchCities(selectedCountry.code, searchTerm);
    }
  };

  const handleExactLocationChange = (location: string) => {
    setExactLocation(location);
  };

  const handleExactLocationSubmit = () => {
    if (exactLocation.trim()) {
      onChange(`${exactLocation.trim()}, ${citySearch}, ${selectedCountry?.name}`);
    } else {
      onChange(`${citySearch}, ${selectedCountry?.name}`);
    }
  };

  const resetSelection = () => {
    setSelectedCountry(null);
    setCountrySearch('');
    setCitySearch('');
    setExactLocation('');
    setStep('country');
    setCities([]);
    onChange('');
  };

  // Enhanced search with fuzzy matching
  const searchLocations = useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    
    const results = [];
    const searchLower = searchInput.toLowerCase();
    
    // Search in countries
    countries.forEach(country => {
      if (country.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'country',
          name: country.name,
          display: `${country.flag} ${country.name}`,
          country: country,
          city: null
        });
      }
    });
    
    // Search in cities
    cities.forEach(city => {
      if (city.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'city',
          name: city.name,
          display: `${city.name}, ${city.country}`,
          country: selectedCountry,
          city: city
        });
      }
    });
    
    return results.slice(0, 10); // Limit results
  }, [searchInput, countries, cities, selectedCountry]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        🗺️ {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Country Selection */}
      <div className="relative" ref={countryRef}>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryDropdown(true);
                if (step === 'city') {
                  setStep('country');
                  setSelectedCountry(null);
                  setCitySearch('');
                  onChange('');
                }
              }}
              onFocus={() => setShowCountryDropdown(true)}
              placeholder="Search country..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
            />
          </div>
          {selectedCountry && (
            <button
              type="button"
              onClick={resetSelection}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {showCountryDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-slate-500 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div>No countries found</div>
              </div>
            ) : (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="mr-3 text-lg">{country.flag}</span>
                  <span className="text-slate-900 font-medium">{country.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* City Selection */}
      {step === 'city' && selectedCountry && (
        <div className="relative" ref={cityRef}>
          <input
            type="text"
            value={citySearch}
            onChange={(e) => {
              handleCitySearchChange(e.target.value);
              setShowCityDropdown(true);
            }}
            onFocus={() => {
              setShowCityDropdown(true);
              if (cities.length === 0) {
                fetchCities(selectedCountry.code);
              }
            }}
            placeholder={`Search cities in ${selectedCountry.name}...`}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
          />

          {showCityDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-3 text-slate-500 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <div>Loading cities...</div>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="px-4 py-3 text-slate-500">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏙️</div>
                    <div className="mb-2">{citySearch ? 'No cities found in our list' : 'Start typing to search cities...'}</div>
                  </div>
                  {citySearch && citySearch.length > 1 && (
                    <div 
                      onClick={() => {
                        setCitySearch(citySearch);
                        setShowCityDropdown(false);
                        if (showExactLocation) {
                          setStep('exact');
                          setExactLocation('');
                        } else {
                          onChange(`${citySearch}, ${selectedCountry?.name}`);
                        }
                      }}
                      className="mt-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors border border-blue-200"
                    >
                      <div className="text-blue-800 font-medium">Use "{citySearch}"</div>
                      <div className="text-blue-600 text-xs">Click to use this city name</div>
                    </div>
                  )}
                </div>
              ) : (
                filteredCities.map((city, index) => (
                  <div
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="font-semibold text-slate-900">{city.name}</div>
                    {city.population > 0 && (
                      <div className="text-xs text-slate-500">
                        Population: {city.population.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Global Search (Alternative to step-by-step) */}
      <div className="relative">
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
            }}
            onFocus={() => setShowSuggestions(searchInput.length >= 2)}
            placeholder="Or search any location globally..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setShowSuggestions(false);
              }}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {showSuggestions && searchLocations.length > 0 && (
          <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchLocations.map((result, index) => (
              <div
                key={index}
                onClick={() => {
                  if (result.type === 'country' && result.country) {
                    handleCountrySelect(result.country);
                  } else if (result.type === 'city' && result.city) {
                    setSelectedCountry(result.country);
                    setCountrySearch(result.country?.name || '');
                    handleCitySelect(result.city);
                  }
                  setSearchInput('');
                  setShowSuggestions(false);
                }}
                className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
              >
                <span className="mr-3 text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {result.type === 'country' ? '🏳️' : '🏙️'}
                </span>
                <span className="text-slate-900 font-medium">{result.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exact Location Input */}
      {step === 'exact' && selectedCountry && citySearch && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-600">📍</span>
            <span className="text-slate-700 text-sm">{citySearch}, {selectedCountry.name}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              🏢 Exact Location (Optional)
            </label>
            <input
              type="text"
              value={exactLocation}
              onChange={(e) => handleExactLocationChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleExactLocationSubmit()}
              placeholder="e.g., 123 Main Street, Downtown, Airport Terminal 2, Hotel Name..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 text-slate-900 placeholder-slate-400"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">Add specific address, landmark, or area for precise location</p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange(`${citySearch}, ${selectedCountry?.name}`);
                    setStep('city');
                    setExactLocation('');
                  }}
                  className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleExactLocationSubmit}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Location Display */}
      {value && step !== 'exact' && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-blue-700">📍</span>
            <span className="text-blue-800 font-semibold">{value}</span>
          </div>
          <button
            type="button"
            onClick={resetSelection}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}