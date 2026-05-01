import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGlobe, FiUsers, FiHash, FiArrowRight, FiX,
  FiLoader, FiLock, FiUnlock, FiChevronRight,
  FiEye, FiTarget, FiAward, FiMap, FiPlay, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi'
import { useSocket } from '../context/SocketContext'
import { useGame } from '../context/GameContext'

/* ─── Data ───────────────────────────────────────────────────────────────── */
const LIVE_LOCATIONS = [
  { city: 'Tokyo',          country: 'Japan',           lat: '35.67° N', lng: '139.65° E', flag: '🇯🇵' },
  { city: 'Paris',          country: 'France',          lat: '48.86° N', lng: '2.35° E',   flag: '🇫🇷' },
  { city: 'Rio de Janeiro', country: 'Brazil',          lat: '22.91° S', lng: '43.17° W',  flag: '🇧🇷' },
  { city: 'Sydney',         country: 'Australia',       lat: '33.87° S', lng: '151.21° E', flag: '🇦🇺' },
  { city: 'Cairo',          country: 'Egypt',           lat: '30.04° N', lng: '31.24° E',  flag: '🇪🇬' },
  { city: 'New York',       country: 'USA',             lat: '40.71° N', lng: '74.01° W',  flag: '🇺🇸' },
  { city: 'Mumbai',         country: 'India',           lat: '19.08° N', lng: '72.88° E',  flag: '🇮🇳' },
  { city: 'Cape Town',      country: 'South Africa',    lat: '33.93° S', lng: '18.42° E',  flag: '🇿🇦' },
  { city: 'Dubai',          country: 'UAE',             lat: '25.20° N', lng: '55.27° E',  flag: '🇦🇪' },
  { city: 'London',         country: 'United Kingdom',  lat: '51.51° N', lng: '0.13° W',   flag: '🇬🇧' },
  { city: 'Istanbul',       country: 'Turkey',          lat: '41.01° N', lng: '28.95° E',  flag: '🇹🇷' },
  { city: 'Buenos Aires',   country: 'Argentina',       lat: '34.60° S', lng: '58.38° W',  flag: '🇦🇷' },
  { city: 'Bangkok',        country: 'Thailand',        lat: '13.76° N', lng: '100.50° E', flag: '🇹🇭' },
  { city: 'Mexico City',    country: 'Mexico',          lat: '19.43° N', lng: '99.13° W',  flag: '🇲🇽' },
  { city: 'Lagos',          country: 'Nigeria',         lat: '6.52° N',  lng: '3.38° E',   flag: '🇳🇬' },
  { city: 'Seoul',          country: 'South Korea',     lat: '37.57° N', lng: '126.98° E', flag: '🇰🇷' },
  { city: 'Moscow',         country: 'Russia',          lat: '55.75° N', lng: '37.62° E',  flag: '🇷🇺' },
  { city: 'Singapore',      country: 'Singapore',       lat: '1.35° N',  lng: '103.82° E', flag: '🇸🇬' },
  { city: 'Nairobi',        country: 'Kenya',           lat: '1.29° S',  lng: '36.82° E',  flag: '🇰🇪' },
  { city: 'Toronto',        country: 'Canada',          lat: '43.65° N', lng: '79.38° W',  flag: '🇨🇦' },
]

const ALL_COUNTRIES = [
  // Major world cities
  { city: 'Tokyo', flag: '🇯🇵' }, { city: 'Paris', flag: '🇫🇷' }, { city: 'New York', flag: '🇺🇸' },
  { city: 'London', flag: '🇬🇧' }, { city: 'Dubai', flag: '🇦🇪' }, { city: 'Sydney', flag: '🇦🇺' },
  { city: 'Mumbai', flag: '🇮🇳' }, { city: 'Cairo', flag: '🇪🇬' }, { city: 'Rio', flag: '🇧🇷' },
  { city: 'Moscow', flag: '🇷🇺' }, { city: 'Seoul', flag: '🇰🇷' }, { city: 'Istanbul', flag: '🇹🇷' },
  { city: 'Singapore', flag: '🇸🇬' }, { city: 'Lagos', flag: '🇳🇬' }, { city: 'Toronto', flag: '🇨🇦' },
  { city: 'Bangkok', flag: '🇹🇭' }, { city: 'Mexico City', flag: '🇲🇽' }, { city: 'Nairobi', flag: '🇰🇪' },
  { city: 'Buenos Aires', flag: '🇦🇷' }, { city: 'Cape Town', flag: '🇿🇦' }, { city: 'Berlin', flag: '🇩🇪' },
  { city: 'Madrid', flag: '🇪🇸' }, { city: 'Rome', flag: '🇮🇹' }, { city: 'Amsterdam', flag: '🇳🇱' },
  { city: 'Vienna', flag: '🇦🇹' }, { city: 'Warsaw', flag: '🇵🇱' }, { city: 'Kyiv', flag: '🇺🇦' },
  { city: 'Stockholm', flag: '🇸🇪' }, { city: 'Oslo', flag: '🇳🇴' }, { city: 'Copenhagen', flag: '🇩🇰' },
  { city: 'Helsinki', flag: '🇫🇮' }, { city: 'Lisbon', flag: '🇵🇹' }, { city: 'Athens', flag: '🇬🇷' },
  { city: 'Prague', flag: '🇨🇿' }, { city: 'Budapest', flag: '🇭🇺' }, { city: 'Bucharest', flag: '🇷🇴' },
  { city: 'Brussels', flag: '🇧🇪' }, { city: 'Zurich', flag: '🇨🇭' }, { city: 'Dublin', flag: '🇮🇪' },
  { city: 'Beijing', flag: '🇨🇳' }, { city: 'Shanghai', flag: '🇨🇳' }, { city: 'Hong Kong', flag: '🇭🇰' },
  { city: 'Taipei', flag: '🇹🇼' }, { city: 'Kuala Lumpur', flag: '🇲🇾' }, { city: 'Jakarta', flag: '🇮🇩' },
  { city: 'Manila', flag: '🇵🇭' }, { city: 'Hanoi', flag: '🇻🇳' }, { city: 'Colombo', flag: '🇱🇰' },
  { city: 'Karachi', flag: '🇵🇰' }, { city: 'Dhaka', flag: '🇧🇩' }, { city: 'Kathmandu', flag: '🇳🇵' },
  { city: 'Kabul', flag: '🇦🇫' }, { city: 'Tehran', flag: '🇮🇷' }, { city: 'Baghdad', flag: '🇮🇶' },
  { city: 'Riyadh', flag: '🇸🇦' }, { city: 'Doha', flag: '🇶🇦' }, { city: 'Kuwait City', flag: '🇰🇼' },
  { city: 'Amman', flag: '🇯🇴' }, { city: 'Beirut', flag: '🇱🇧' }, { city: 'Tel Aviv', flag: '🇮🇱' },
  { city: 'Ankara', flag: '🇹🇷' }, { city: 'Tbilisi', flag: '🇬🇪' }, { city: 'Baku', flag: '🇦🇿' },
  { city: 'Tashkent', flag: '🇺🇿' }, { city: 'Almaty', flag: '🇰🇿' }, { city: 'Ulaanbaatar', flag: '🇲🇳' },
  { city: 'Islamabad', flag: '🇵🇰' }, { city: 'New Delhi', flag: '🇮🇳' }, { city: 'Kolkata', flag: '🇮🇳' },
  { city: 'Accra', flag: '🇬🇭' }, { city: 'Abidjan', flag: '🇨🇮' }, { city: 'Dakar', flag: '🇸🇳' },
  { city: 'Addis Ababa', flag: '🇪🇹' }, { city: 'Dar es Salaam', flag: '🇹🇿' }, { city: 'Kampala', flag: '🇺🇬' },
  { city: 'Kigali', flag: '🇷🇼' }, { city: 'Lusaka', flag: '🇿🇲' }, { city: 'Harare', flag: '🇿🇼' },
  { city: 'Casablanca', flag: '🇲🇦' }, { city: 'Tunis', flag: '🇹🇳' }, { city: 'Tripoli', flag: '🇱🇾' },
  { city: 'Khartoum', flag: '🇸🇩' }, { city: 'Kinshasa', flag: '🇨🇩' }, { city: 'Luanda', flag: '🇦🇴' },
  { city: 'São Paulo', flag: '🇧🇷' }, { city: 'Lima', flag: '🇵🇪' }, { city: 'Bogotá', flag: '🇨🇴' },
  { city: 'Santiago', flag: '🇨🇱' }, { city: 'Caracas', flag: '🇻🇪' }, { city: 'Quito', flag: '🇪🇨' },
  { city: 'La Paz', flag: '🇧🇴' }, { city: 'Asunción', flag: '🇵🇾' }, { city: 'Montevideo', flag: '🇺🇾' },
  { city: 'Panama City', flag: '🇵🇦' }, { city: 'San José', flag: '🇨🇷' }, { city: 'Havana', flag: '🇨🇺' },
  { city: 'Kingston', flag: '🇯🇲' }, { city: 'Port-au-Prince', flag: '🇭🇹' }, { city: 'Santo Domingo', flag: '🇩🇴' },
  { city: 'Chicago', flag: '🇺🇸' }, { city: 'Los Angeles', flag: '🇺🇸' }, { city: 'Vancouver', flag: '🇨🇦' },
  { city: 'Auckland', flag: '🇳🇿' }, { city: 'Wellington', flag: '🇳🇿' }, { city: 'Suva', flag: '🇫🇯' },
  { city: 'Reykjavik', flag: '🇮🇸' }, { city: 'Valletta', flag: '🇲🇹' }, { city: 'Nicosia', flag: '🇨🇾' },
  { city: 'Sarajevo', flag: '🇧🇦' }, { city: 'Belgrade', flag: '🇷🇸' }, { city: 'Sofia', flag: '🇧🇬' },
  { city: 'Skopje', flag: '🇲🇰' }, { city: 'Tirana', flag: '🇦🇱' }, { city: 'Podgorica', flag: '🇲🇪' },
  { city: 'Minsk', flag: '🇧🇾' }, { city: 'Riga', flag: '🇱🇻' }, { city: 'Tallinn', flag: '🇪🇪' },
  { city: 'Vilnius', flag: '🇱🇹' }, { city: 'Chisinau', flag: '🇲🇩' }, { city: 'Yerevan', flag: '🇦🇲' },
  // European cities
  { city: 'Barcelona', flag: '🇪🇸' }, { city: 'Seville', flag: '🇪🇸' }, { city: 'Valencia', flag: '🇪🇸' },
  { city: 'Florence', flag: '🇮🇹' }, { city: 'Milan', flag: '🇮🇹' }, { city: 'Naples', flag: '🇮🇹' },
  { city: 'Venice', flag: '🇮🇹' }, { city: 'Turin', flag: '🇮🇹' }, { city: 'Palermo', flag: '🇮🇹' },
  { city: 'Edinburgh', flag: '🇬🇧' }, { city: 'Manchester', flag: '🇬🇧' }, { city: 'Birmingham', flag: '🇬🇧' },
  { city: 'Munich', flag: '🇩🇪' }, { city: 'Hamburg', flag: '🇩🇪' }, { city: 'Frankfurt', flag: '🇩🇪' },
  { city: 'Marseille', flag: '🇫🇷' }, { city: 'Lyon', flag: '🇫🇷' }, { city: 'Nice', flag: '🇫🇷' },
  { city: 'Geneva', flag: '🇨🇭' }, { city: 'Bern', flag: '🇨🇭' }, { city: 'Porto', flag: '🇵🇹' },
  { city: 'Krakow', flag: '🇵🇱' }, { city: 'Gdansk', flag: '🇵🇱' }, { city: 'Thessaloniki', flag: '🇬🇷' },
  { city: 'Dubrovnik', flag: '🇭🇷' }, { city: 'Zagreb', flag: '🇭🇷' }, { city: 'Ljubljana', flag: '🇸🇮' },
  { city: 'Bratislava', flag: '🇸🇰' }, { city: 'Bruges', flag: '🇧🇪' }, { city: 'Ghent', flag: '🇧🇪' },
  { city: 'Luxembourg City', flag: '🇱🇺' }, { city: 'Andorra la Vella', flag: '🇦🇩' }, { city: 'Monaco', flag: '🇲🇨' },
  { city: 'Pristina', flag: '🇽🇰' }, { city: 'Vaduz', flag: '🇱🇮' }, { city: 'San Marino', flag: '🇸🇲' },
  // African capitals & cities
  { city: 'Algiers', flag: '🇩🇿' }, { city: 'Bamako', flag: '🇲🇱' }, { city: 'Bangui', flag: '🇨🇫' },
  { city: 'Banjul', flag: '🇬🇲' }, { city: 'Brazzaville', flag: '🇨🇬' }, { city: 'Bujumbura', flag: '🇧🇮' },
  { city: 'Conakry', flag: '🇬🇳' }, { city: 'Djibouti', flag: '🇩🇯' }, { city: 'Freetown', flag: '🇸🇱' },
  { city: 'Gaborone', flag: '🇧🇼' }, { city: 'Juba', flag: '🇸🇸' }, { city: 'Libreville', flag: '🇬🇦' },
  { city: 'Lilongwe', flag: '🇲🇼' }, { city: 'Lomé', flag: '🇹🇬' }, { city: 'Maputo', flag: '🇲🇿' },
  { city: 'Maseru', flag: '🇱🇸' }, { city: 'Mbabane', flag: '🇸🇿' }, { city: 'Mogadishu', flag: '🇸🇴' },
  { city: 'Monrovia', flag: '🇱🇷' }, { city: 'Moroni', flag: '🇰🇲' }, { city: "N'Djamena", flag: '🇹🇩' },
  { city: 'Niamey', flag: '🇳🇪' }, { city: 'Nouakchott', flag: '🇲🇷' }, { city: 'Ouagadougou', flag: '🇧🇫' },
  { city: 'Porto-Novo', flag: '🇧🇯' }, { city: 'Praia', flag: '🇨🇻' }, { city: 'Windhoek', flag: '🇳🇦' },
  { city: 'Yamoussoukro', flag: '🇨🇮' }, { city: 'Malabo', flag: '🇬🇶' }, { city: 'Asmara', flag: '🇪🇷' },
  // Asian capitals & cities
  { city: 'Ashgabat', flag: '🇹🇲' }, { city: 'Astana', flag: '🇰🇿' }, { city: 'Dili', flag: '🇹🇱' },
  { city: 'Phnom Penh', flag: '🇰🇭' }, { city: 'Vientiane', flag: '🇱🇦' }, { city: 'Thimphu', flag: '🇧🇹' },
  { city: 'Naypyidaw', flag: '🇲🇲' }, { city: 'Male', flag: '🇲🇻' }, { city: 'Dushanbe', flag: '🇹🇯' },
  { city: 'Bishkek', flag: '🇰🇬' }, { city: 'Ho Chi Minh City', flag: '🇻🇳' }, { city: 'Osaka', flag: '🇯🇵' },
  { city: 'Bangalore', flag: '🇮🇳' }, { city: 'Chennai', flag: '🇮🇳' }, { city: 'Hyderabad', flag: '🇮🇳' },
  { city: 'Lahore', flag: '🇵🇰' }, { city: 'Chittagong', flag: '🇧🇩' }, { city: 'Guangzhou', flag: '🇨🇳' },
  { city: 'Shenzhen', flag: '🇨🇳' }, { city: 'Chengdu', flag: '🇨🇳' }, { city: 'Wuhan', flag: '🇨🇳' },
  { city: 'Muscat', flag: '🇴🇲' }, { city: 'Abu Dhabi', flag: '🇦🇪' }, { city: 'Manama', flag: '🇧🇭' },
  // Pacific & Oceania
  { city: 'Apia', flag: '🇼🇸' }, { city: 'Honiara', flag: '🇸🇧' }, { city: 'Port Moresby', flag: '🇵🇬' },
  { city: 'Port Vila', flag: '🇻🇺' }, { city: 'Nuku\'alofa', flag: '🇹🇴' }, { city: 'Tarawa', flag: '🇰🇮' },
  { city: 'Palikir', flag: '🇫🇲' }, { city: 'Melbourne', flag: '🇦🇺' }, { city: 'Brisbane', flag: '🇦🇺' },
  { city: 'Perth', flag: '🇦🇺' }, { city: 'Christchurch', flag: '🇳🇿' },
  // Americas
  { city: 'Brasilia', flag: '🇧🇷' }, { city: 'Belo Horizonte', flag: '🇧🇷' }, { city: 'Manaus', flag: '🇧🇷' },
  { city: 'Recife', flag: '🇧🇷' }, { city: 'Guadalajara', flag: '🇲🇽' }, { city: 'Monterrey', flag: '🇲🇽' },
  { city: 'Medellín', flag: '🇨🇴' }, { city: 'Cartagena', flag: '🇨🇴' }, { city: 'Arequipa', flag: '🇵🇪' },
  { city: 'Córdoba', flag: '🇦🇷' }, { city: 'Rosario', flag: '🇦🇷' }, { city: 'Guayaquil', flag: '🇪🇨' },
  { city: 'Miami', flag: '🇺🇸' }, { city: 'Houston', flag: '🇺🇸' }, { city: 'Seattle', flag: '🇺🇸' },
  { city: 'San Francisco', flag: '🇺🇸' }, { city: 'Boston', flag: '🇺🇸' }, { city: 'Montreal', flag: '🇨🇦' },
  // Famous landmarks & places
  { city: 'Eiffel Tower', flag: '🇫🇷' }, { city: 'Big Ben', flag: '🇬🇧' }, { city: 'Taj Mahal', flag: '🇮🇳' },
  { city: 'Colosseum', flag: '🇮🇹' }, { city: 'Machu Picchu', flag: '🇵🇪' }, { city: 'Angkor Wat', flag: '🇰🇭' },
  { city: 'Stonehenge', flag: '🇬🇧' }, { city: 'Burj Khalifa', flag: '🇦🇪' }, { city: 'Acropolis', flag: '🇬🇷' },
  { city: 'Petra', flag: '🇯🇴' }, { city: 'Chichen Itza', flag: '🇲🇽' }, { city: 'Pyramids of Giza', flag: '🇪🇬' },
  { city: 'Sagrada Familia', flag: '🇪🇸' }, { city: 'Mt. Fuji', flag: '🇯🇵' }, { city: 'Kilimanjaro', flag: '🇹🇿' },
  { city: 'Galápagos', flag: '🇪🇨' }, { city: 'Maldives', flag: '🇲🇻' }, { city: 'Santorini', flag: '🇬🇷' },
  { city: 'Bali', flag: '🇮🇩' }, { city: 'Cappadocia', flag: '🇹🇷' }, { city: 'Patagonia', flag: '🇦🇷' },
  { city: 'Norwegian Fjords', flag: '🇳🇴' }, { city: 'Amalfi Coast', flag: '🇮🇹' }, { city: 'Meteora', flag: '🇬🇷' },
  { city: 'Lofoten Islands', flag: '🇳🇴' }, { city: 'Grand Canyon', flag: '🇺🇸' }, { city: 'Niagara Falls', flag: '🇨🇦' },
  { city: 'Victoria Falls', flag: '🇿🇲' }, { city: 'Serengeti', flag: '🇹🇿' }, { city: 'Great Barrier Reef', flag: '🇦🇺' },
  { city: 'Amazon River', flag: '🇧🇷' }, { city: 'Sahara Desert', flag: '🇲🇦' }, { city: 'Dead Sea', flag: '🇯🇴' },
  { city: 'Everest Base Camp', flag: '🇳🇵' }, { city: 'Banff', flag: '🇨🇦' }, { city: 'Yellowstone', flag: '🇺🇸' },
  { city: 'Phuket', flag: '🇹🇭' }, { city: 'Cinque Terre', flag: '🇮🇹' }, { city: 'Alhambra', flag: '🇪🇸' },
]

const FACT_COLORS = ['#f97316','#22c55e','#3b82f6','#f59e0b','#06b6d4','#ef4444','#a855f7','#00d4aa','#84cc16','#60a5fa','#ec4899','#14b8a6']

const PIN_ZONES = [
  { top: '12%', left: '12%' }, { top: '12%', left: '40%' }, { top: '12%', left: '68%' },
  { top: '36%', left: '5%'  }, { top: '36%', left: '32%' }, { top: '36%', left: '60%' }, { top: '36%', left: '84%' },
  { top: '64%', left: '18%' }, { top: '64%', left: '48%' }, { top: '64%', left: '76%' },
]

const TICKER_ITEMS = [
  '🌍 Real Google Street View locations across 195 countries',
  '🗼 Eiffel Tower stands 330m tall in Paris, France',
  '🎯 Closest guess wins — accuracy down to 0.1 km',
  '🌊 The Pacific Ocean covers more area than all land combined',
  '👥 Up to 8 players per game — invite friends worldwide',
  '🏔️ Mount Everest is 8,849m — the highest point on Earth',
  '⚡ Live multiplayer — no account or login needed',
  '🌵 The Sahara Desert is almost as large as the USA',
  '🗺️ Pin your guess anywhere on the world map',
  '🦁 Africa is home to 54 countries and 2,000+ languages',
  '🔍 The hider crafts clues from inside Street View',
  '🌏 Asia covers 30% of Earth\'s total land area',
  '🎮 Create private rooms or join public games instantly',
  '🌋 Indonesia has more volcanoes than any other country',
  '📍 Every round is a completely new real-world location',
  '🏙️ Tokyo is the world\'s most populous city at 37M people',
  '🌐 Play against players from every continent',
  '🧊 Antarctica is the largest desert on Earth',
]

const WORLD_FACTS = [
  // Geography records
  { fact: 'Russia spans 11 time zones', detail: 'Largest country on Earth at 17.1 million km²', flag: '🇷🇺' },
  { fact: 'Vatican City is the world\'s smallest country', detail: 'Just 0.44 km² — fits inside New York\'s Central Park', flag: '🇻🇦' },
  { fact: 'Mount Everest stands at 8,849 metres', detail: 'The highest point on Earth, still growing 5mm per year', flag: '🇳🇵' },
  { fact: 'The Mariana Trench is 11,034 metres deep', detail: 'Deepest known point in any ocean on Earth', flag: '🇺🇲' },
  { fact: 'The Dead Sea sits 430 metres below sea level', detail: 'The lowest point on Earth\'s surface', flag: '🇯🇴' },
  { fact: 'The Nile is the world\'s longest river', detail: '6,650 km flowing through 11 countries', flag: '🇪🇬' },
  { fact: 'Lake Baikal holds 20% of Earth\'s freshwater', detail: 'The world\'s deepest lake at 1,642 metres', flag: '🇷🇺' },
  { fact: 'The Sahara is larger than the continental USA', detail: '9.2 million km² of the world\'s largest hot desert', flag: '🇲🇦' },
  { fact: 'Antarctica is the largest desert on Earth', detail: 'At 14.2 million km², it\'s a cold desert', flag: '🇦🇶' },
  { fact: 'Angel Falls drops 979 metres', detail: 'World\'s highest uninterrupted waterfall, in Venezuela', flag: '🇻🇪' },
  { fact: 'The Pacific Ocean is larger than all land combined', detail: 'Covers 165 million km² — 30% of Earth\'s surface', flag: '🌊' },
  { fact: 'Greenland is the world\'s largest island', detail: '2.13 million km², covered 80% by ice sheet', flag: '🇬🇱' },
  { fact: 'The Amazon discharges 20% of all river water', detail: 'Into the Atlantic Ocean — more than the next 7 rivers combined', flag: '🇧🇷' },
  { fact: 'K2 has a 1-in-4 death rate for climbers', detail: 'The world\'s most dangerous mountain to summit', flag: '🇵🇰' },
  { fact: 'Victoria Falls is the world\'s largest waterfall', detail: '1,708 metres wide — called "The Smoke That Thunders"', flag: '🇿🇲' },
  // Cities
  { fact: 'Tokyo is the world\'s most populous city', detail: '37 million people in the greater metro area', flag: '🇯🇵' },
  { fact: 'Istanbul is the only city on two continents', detail: 'Split between Europe and Asia by the Bosphorus Strait', flag: '🇹🇷' },
  { fact: 'Venice is built on 118 small islands', detail: 'Connected by 400+ bridges, cars are banned', flag: '🇮🇹' },
  { fact: 'Hong Kong has 7,500 skyscrapers', detail: 'More skyscrapers than any other city on Earth', flag: '🇭🇰' },
  { fact: 'Dubai grew from 40,000 to 3.5 million in 60 years', detail: 'One of the fastest growing cities in history', flag: '🇦🇪' },
  { fact: 'New York City has 800+ languages spoken', detail: 'The most linguistically diverse city in the world', flag: '🇺🇸' },
  { fact: 'London has 80+ languages spoken daily', detail: 'Over 300 nationalities call London home', flag: '🇬🇧' },
  { fact: 'Mexico City sits at 2,240 metres altitude', detail: 'The world\'s highest altitude major city', flag: '🇲🇽' },
  { fact: 'Singapore fits 5.6 million people in 733 km²', detail: 'One of the world\'s most densely populated countries', flag: '🇸🇬' },
  { fact: 'Cairo is home to 21 million people', detail: 'The largest city in Africa and the Arab world', flag: '🇪🇬' },
  { fact: 'Reykjavik is the world\'s most northerly capital', detail: 'And still one of the warmest thanks to the Gulf Stream', flag: '🇮🇸' },
  { fact: 'Amsterdam has 1,000+ km of canals', detail: 'More canals than Venice, with 1,500 bridges', flag: '🇳🇱' },
  { fact: 'Chicago built the world\'s first skyscraper in 1885', detail: 'The 10-storey Home Insurance Building changed cities forever', flag: '🇺🇸' },
  { fact: 'Kathmandu is ringed by 8 of the 10 highest peaks', detail: 'The Himalayas surround Nepal\'s capital on all sides', flag: '🇳🇵' },
  { fact: 'Baghdad was once the world\'s largest city', detail: 'In the 8th century it had over 1 million people', flag: '🇮🇶' },
  // Countries
  { fact: 'Canada has the world\'s longest coastline', detail: '202,080 km — longer than the next 4 countries combined', flag: '🇨🇦' },
  { fact: 'Indonesia has 17,000+ islands', detail: 'The world\'s largest archipelago nation', flag: '🇮🇩' },
  { fact: 'Japan\'s monarchy is the oldest in the world', detail: 'Continuous for over 2,600 years', flag: '🇯🇵' },
  { fact: 'Iceland runs on 100% renewable energy', detail: 'Powered entirely by geothermal and hydropower', flag: '🇮🇸' },
  { fact: 'India speaks 780+ languages', detail: 'More languages than any other country on Earth', flag: '🇮🇳' },
  { fact: 'Papua New Guinea has 800+ languages', detail: 'The most languages per capita of any country', flag: '🇵🇬' },
  { fact: 'Bolivia has two capital cities', detail: 'Sucre (constitutional) and La Paz (government seat)', flag: '🇧🇴' },
  { fact: 'New Zealand gave women the vote in 1893', detail: 'The first self-governing country to do so', flag: '🇳🇿' },
  { fact: 'Philippines has 7,641 islands', detail: 'Only about 2,000 of them are inhabited', flag: '🇵🇭' },
  { fact: 'Bhutan measures Gross National Happiness', detail: 'The world\'s only country to prioritise happiness over GDP', flag: '🇧🇹' },
  { fact: 'Netherlands has 26% of land below sea level', detail: 'Protected by 3,500 km of dikes and barriers', flag: '🇳🇱' },
  { fact: 'Australia is both a continent and a country', detail: 'The only nation to occupy an entire continent', flag: '🇦🇺' },
  { fact: 'France is the world\'s most visited country', detail: '89 million tourists arrive every year', flag: '🇫🇷' },
  { fact: 'Switzerland has 4 official languages', detail: 'German, French, Italian and Romansh', flag: '🇨🇭' },
  { fact: 'Norway has a sovereign wealth fund of $1.4 trillion', detail: 'The world\'s largest, funded by North Sea oil', flag: '🇳🇴' },
  { fact: 'Costa Rica has had no army since 1948', detail: 'Spends its military budget on education and healthcare', flag: '🇨🇷' },
  { fact: 'Finland is the world\'s happiest country', detail: 'Ranked #1 in the World Happiness Report 7 years running', flag: '🇫🇮' },
  { fact: 'South Korea has the world\'s fastest internet', detail: 'Average speeds of over 200 Mbps nationwide', flag: '🇰🇷' },
  { fact: 'Brazil is larger than the contiguous USA', detail: 'Fifth largest country by area at 8.5 million km²', flag: '🇧🇷' },
  { fact: 'Ethiopia is the oldest independent country in Africa', detail: 'Never colonised — defeated Italy at Adwa in 1896', flag: '🇪🇹' },
  { fact: 'China\'s civilisation is 5,000 years old', detail: 'The world\'s longest continuously existing civilisation', flag: '🇨🇳' },
  // Nature & Wildlife
  { fact: 'The Amazon rainforest produces 20% of Earth\'s oxygen', detail: 'Spanning 9 countries across South America', flag: '🇧🇷' },
  { fact: 'Madagascar has 90% unique wildlife', detail: '90% of species found there exist nowhere else on Earth', flag: '🇲🇬' },
  { fact: 'The Great Barrier Reef is visible from space', detail: '2,300 km long — the world\'s largest living structure', flag: '🇦🇺' },
  { fact: 'Galápagos Islands inspired Darwin', detail: 'His 1835 visit led directly to the theory of evolution', flag: '🇪🇨' },
  { fact: 'The blue whale is the largest animal ever', detail: 'Up to 33 metres long and 150 tonnes in weight', flag: '🌊' },
  { fact: 'Komodo dragons can grow up to 3 metres long', detail: 'The world\'s largest living lizards, found in Indonesia', flag: '🇮🇩' },
  { fact: '1.5 million wildebeest migrate across the Serengeti', detail: 'The world\'s largest land animal migration', flag: '🇹🇿' },
  { fact: 'Monarch butterflies migrate 4,500 km', detail: 'From Canada to Mexico — guided by Earth\'s magnetic field', flag: '🇲🇽' },
  { fact: 'The Amazon has 390 billion trees', detail: '16,000 species in the world\'s most biodiverse forest', flag: '🇧🇷' },
  { fact: 'Saharan sand reaches the Caribbean', detail: 'Dust particles travel 8,000 km across the Atlantic Ocean', flag: '🌍' },
  { fact: 'The Maldives beaches glow at night', detail: 'Bioluminescent plankton create a natural blue glow in the waves', flag: '🇲🇻' },
  { fact: 'Yellowstone has 10,000 thermal features', detail: 'More than any other place on Earth — a supervolcano below', flag: '🇺🇸' },
  { fact: 'Borneo is shared by three countries', detail: 'Malaysia, Indonesia and Brunei share the world\'s 3rd largest island', flag: '🇲🇾' },
  { fact: 'The Namib Desert is 55 million years old', detail: 'The world\'s oldest desert, stretching 2,000 km along Africa\'s coast', flag: '🇳🇦' },
  { fact: 'Giant pandas exist only in 6 mountain ranges', detail: 'All in Sichuan, Shaanxi and Gansu provinces of China', flag: '🇨🇳' },
  // Oceans & Water
  { fact: 'The Pacific Ocean has 25,000+ islands', detail: 'More islands than all other oceans combined', flag: '🌊' },
  { fact: 'The Mediterranean touches 22 countries', detail: 'Bordered by Europe, Africa and Asia simultaneously', flag: '🌊' },
  { fact: 'The Black Sea has almost no oxygen below 150m', detail: 'Ancient ships are preserved perfectly in its depths', flag: '🌊' },
  { fact: 'The Congo is the world\'s deepest river', detail: 'Over 220 metres deep in places — too deep to measure easily', flag: '🇨🇩' },
  { fact: 'The Dead Sea is shrinking by 1 metre per year', detail: 'Over-extraction of water has reduced it by a third since 1960', flag: '🇯🇴' },
  { fact: 'The Mekong River flows through 6 countries', detail: 'From China\'s Tibetan Plateau to Vietnam\'s delta', flag: '🇻🇳' },
  { fact: 'Lake Titicaca is the world\'s highest navigable lake', detail: 'At 3,812 metres, on the Bolivia-Peru border', flag: '🇵🇪' },
  { fact: 'The Thames was declared biologically dead in 1957', detail: 'Now has 115 species of fish — one of history\'s greatest cleanups', flag: '🇬🇧' },
  { fact: '75% of Earth\'s volcanoes are in the Pacific Ring of Fire', detail: '452 volcanoes encircle the Pacific Ocean', flag: '🌊' },
  { fact: 'The Okavango Delta floods every year in a desert', detail: 'The Kalahari Desert fills with water from Angola\'s rains', flag: '🇧🇼' },
  // Mountains
  { fact: 'The Himalayas are still growing', detail: 'India colliding with Asia pushes them 5mm higher each year', flag: '🇳🇵' },
  { fact: 'Kilimanjaro is Africa\'s highest peak', detail: '5,895 metres — a free-standing volcano in Tanzania', flag: '🇹🇿' },
  { fact: 'The Andes stretch 7,000 km', detail: 'The world\'s longest mountain range, through 7 countries', flag: '🇨🇱' },
  { fact: 'The Alps span 8 countries', detail: 'Visited by 120 million tourists every year', flag: '🇨🇭' },
  { fact: 'Mauna Kea is 10,210m from the ocean floor', detail: 'Taller than Everest when measured from its base', flag: '🇺🇸' },
  { fact: 'The Carpathians hold 50% of Europe\'s brown bears', detail: 'Stretching 1,500 km across 8 countries', flag: '🇷🇴' },
  // Landmarks & Architecture
  { fact: 'The Great Wall of China is 21,196 km long', detail: 'Built over 2,000 years — not visible from space (a myth)', flag: '🇨🇳' },
  { fact: 'The Colosseum held 80,000 spectators', detail: 'Built in just 8 years and completed in 80 AD', flag: '🇮🇹' },
  { fact: 'The Eiffel Tower was built in 2 years and 2 months', detail: 'Originally meant to be demolished after the 1889 World\'s Fair', flag: '🇫🇷' },
  { fact: 'The Burj Khalifa has 163 floors', detail: '828 metres tall — took 22 million man-hours to build', flag: '🇦🇪' },
  { fact: 'The Taj Mahal took 22 years to build', detail: '20,000 workers and 1,000 elephants were used in its construction', flag: '🇮🇳' },
  { fact: 'Machu Picchu sits at 2,430 metres altitude', detail: 'Built by the Incas in the 15th century without wheeled transport', flag: '🇵🇪' },
  { fact: 'Angkor Wat is the world\'s largest religious monument', detail: '400 km² in Cambodia — built in the 12th century', flag: '🇰🇭' },
  { fact: 'Stonehenge stones weigh up to 25 tonnes each', detail: 'Transported 250 km from Wales — how remains a mystery', flag: '🇬🇧' },
  { fact: 'Sagrada Familia has been under construction since 1882', detail: 'Still being built — Antoni Gaudí\'s masterpiece in Barcelona', flag: '🇪🇸' },
  { fact: 'The Sydney Opera House has 1 million roof tiles', detail: 'Completed in 1973 after 14 years of construction', flag: '🇦🇺' },
  { fact: 'Chichen Itza aligns perfectly with the solstice', detail: 'On equinox days, a serpent shadow slithers down the pyramid', flag: '🇲🇽' },
  { fact: 'Petra is half buried underground', detail: 'The rose-red city carved into rock by the Nabataeans in 300 BC', flag: '🇯🇴' },
  { fact: 'The Pyramids of Giza are the only ancient wonder standing', detail: 'Built 4,500 years ago with 2.3 million stone blocks each', flag: '🇪🇬' },
  { fact: 'Easter Island\'s Moai weigh 13 tonnes on average', detail: '900 statues carved by the Rapa Nui people, purpose still debated', flag: '🗿' },
  { fact: 'The Acropolis was built in just 15 years', detail: 'Completed 432 BC — the Parthenon withstood 2,400 years of history', flag: '🇬🇷' },
  { fact: 'Hagia Sophia was the world\'s largest church for 1,000 years', detail: 'Built in Constantinople in 537 AD, now a mosque', flag: '🇹🇷' },
  { fact: 'The Golden Gate Bridge has 83,000 km of wire', detail: 'Enough to circle the Earth three times', flag: '🇺🇸' },
  { fact: 'Big Ben\'s clock hands are 4.3 metres long', detail: 'The Great Bell weighs 13.5 tonnes and was cast in 1858', flag: '🇬🇧' },
  // Planet Earth
  { fact: '71% of Earth\'s surface is covered by water', detail: 'Yet 97% of that water is saltwater, undrinkable', flag: '🌍' },
  { fact: 'Earth rotates at 1,674 km/h at the equator', detail: 'We don\'t feel it because we rotate with the planet', flag: '🌍' },
  { fact: 'Earth\'s core is as hot as the surface of the Sun', detail: 'Around 5,100°C — iron and nickel in a liquid state', flag: '🌍' },
  { fact: 'Earth has 8.7 million species', detail: 'Only 1.2 million have been formally identified by science', flag: '🌍' },
  { fact: 'The tectonic plates move 2.5 cm per year', detail: 'Africa and South America were once one continent', flag: '🌍' },
  { fact: 'Earth\'s magnetic north moves 55 km per year', detail: 'It has reversed 180 times in the past 20 million years', flag: '🌍' },
  { fact: 'The atmosphere is 78% nitrogen, 21% oxygen', detail: 'The remaining 1% is argon, CO₂ and other gases', flag: '🌍' },
  { fact: 'A day on Earth is 23 hours 56 minutes', detail: 'Not exactly 24 hours — our clocks slowly drift', flag: '🌍' },
  // Food & Culture
  { fact: 'Italy has 350+ distinct pasta shapes', detail: 'Each region has its own traditional varieties', flag: '🇮🇹' },
  { fact: 'Japan has the world\'s most Michelin-starred restaurants', detail: 'Tokyo alone has more stars than Paris or New York', flag: '🇯🇵' },
  { fact: 'India has 30% of the world\'s vegetarians', detail: 'More vegetarians than the rest of the world combined', flag: '🇮🇳' },
  { fact: 'France produces 1,200+ varieties of cheese', detail: 'Charles de Gaulle once said it\'s impossible to govern such a country', flag: '🇫🇷' },
  { fact: 'Thailand exports more rice than any other country', detail: 'Rice has been grown there for 5,500 years', flag: '🇹🇭' },
  { fact: 'Brazil consumes more coffee than any country except the USA', detail: 'Also the world\'s largest producer of coffee', flag: '🇧🇷' },
  { fact: 'South Korea has over 90,000 coffee shops', detail: 'The highest coffee shop density per capita in the world', flag: '🇰🇷' },
  { fact: 'Mexico is the birthplace of chocolate', detail: 'The Aztecs used cacao beans as currency 3,000 years ago', flag: '🇲🇽' },
  // Language
  { fact: 'There are 7,000+ living languages in the world', detail: 'One language dies every 2 weeks on average', flag: '🌍' },
  { fact: 'Mandarin Chinese has 50,000+ characters', detail: 'You need to know about 2,000 to read a newspaper', flag: '🇨🇳' },
  { fact: 'English has over 170,000 words in current use', detail: 'Plus 47,000 obsolete words in the full Oxford Dictionary', flag: '🇬🇧' },
  { fact: 'Arabic is written right to left', detail: 'And is the 5th most spoken language with 274 million speakers', flag: '🇸🇦' },
  { fact: 'Hawaiian has only 13 letters in its alphabet', detail: 'The shortest alphabet of any language', flag: '🇺🇸' },
  // Space & Exploration
  { fact: 'The ISS travels at 28,000 km/h', detail: 'It orbits Earth every 90 minutes — 16 sunrises per day', flag: '🚀' },
  { fact: 'The Moon is moving away from Earth', detail: '3.8 cm further away every year — it was once 10x closer', flag: '🌕' },
  { fact: 'Voyager 1 is the most distant human-made object', detail: 'Over 23 billion km from Earth — still sending data', flag: '🚀' },
  { fact: 'The Sun makes up 99.86% of the solar system\'s mass', detail: 'Over 1.3 million Earths could fit inside it', flag: '☀️' },
  { fact: 'Light from the Sun takes 8 minutes to reach Earth', detail: 'If the Sun disappeared, we wouldn\'t know for 8 minutes', flag: '☀️' },
].map((f, i) => ({ ...f, color: FACT_COLORS[i % FACT_COLORS.length] }))

const ACTIVITY_EVENTS = [
  { msg: '4 players started a game', loc: 'Tokyo, Japan',          flag: '🇯🇵' },
  { msg: 'Team Blue won!',           loc: '312 km off · Paris',    flag: '🏆' },
  { msg: 'New game created',         loc: 'Sydney, Australia',     flag: '🇦🇺' },
  { msg: 'Explorer is hiding…',      loc: 'Cairo, Egypt',          flag: '🇪🇬' },
  { msg: 'Perfect guess! 23 km',     loc: 'New York, USA',         flag: '🎯' },
  { msg: '6 players joined',         loc: 'Mumbai, India',         flag: '🇮🇳' },
  { msg: 'Round 3 of 5 started',     loc: 'Cape Town · 5 rounds',  flag: '🌍' },
  { msg: 'Team Red wins by 88 km',   loc: 'Rio de Janeiro, Brazil', flag: '🇧🇷' },
]

const HERO_CITIES = ['Paris', 'Tokyo', 'Rio de Janeiro', 'Cairo', 'Sydney', 'New York', 'Mumbai']

const SITE_STATS = [
  { value: '10K+',   label: 'Games Played' },
  { value: '195',    label: 'Countries' },
  { value: '1,248',  label: 'Active Now' },
  { value: '847 km', label: 'Avg Guess' },
]

const STEPS = [
  { n: '01', icon: FiEye,    t: 'Explorer Hides',  d: 'One player roams a real Street View location and crafts clever clues.' },
  { n: '02', icon: FiTarget, t: 'Agents Decode',   d: 'Teammates interpret clues and pin their best guess on a world map.' },
  { n: '03', icon: FiAward,  t: 'Distance Scores', d: 'Closest guess wins points. Most points after all rounds wins.' },
]

/* ─── World grid background ─────────────────────────────────────────────── */
function WorldGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00d4aa" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.4), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      />
    </div>
  )
}

/* ─── Animated globe (right panel) ─────────────────────────────────────── */
function AnimatedGlobe({ stats = {}, recentEvents = [] }) {
  const [liveIdx, setLiveIdx] = useState(0)
  const [activity, setActivity] = useState({ idx: 0, visible: false })
  const allEventsRef = useRef(ACTIVITY_EVENTS)
  const [pins, setPins] = useState(() =>
    PIN_ZONES.map((pos, i) => ({ ...pos, countryIdx: i % ALL_COUNTRIES.length, ver: i }))
  )

  // Cycle 10 pins simultaneously — each slot swaps to a new country independently
  useEffect(() => {
    let nextCountryIdx = PIN_ZONES.length % ALL_COUNTRIES.length
    const id = setInterval(() => {
      const slotIdx = Math.floor(Math.random() * PIN_ZONES.length)
      const ci = nextCountryIdx
      nextCountryIdx = (nextCountryIdx + 1) % ALL_COUNTRIES.length
      setPins(prev => prev.map((p, i) => i === slotIdx ? { ...p, countryIdx: ci, ver: p.ver + 1 } : p))
    }, 1200)
    return () => clearInterval(id)
  }, [])

  // Keep the events ref current so the cycling closure always sees the latest list
  useEffect(() => {
    const realFormatted = recentEvents.map(e => ({ msg: e.msg, loc: e.loc, flag: e.flag }))
    allEventsRef.current = [...realFormatted, ...ACTIVITY_EVENTS].slice(0, 15)
  }, [recentEvents])

  useEffect(() => {
    const id = setInterval(() => setLiveIdx(i => (i + 1) % LIVE_LOCATIONS.length), 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let idx = 0
    const cycle = () => {
      idx = (idx + 1) % allEventsRef.current.length
      setActivity({ idx, visible: true })
      setTimeout(() => setActivity(s => ({ ...s, visible: false })), 2800)
    }
    const initial = setTimeout(cycle, 1800)
    const id = setInterval(cycle, 4500)
    return () => { clearTimeout(initial); clearInterval(id) }
  }, [])

  const live = LIVE_LOCATIONS[liveIdx]
  const events = allEventsRef.current
  const evt = events[activity.idx % events.length]
  const displayActiveGames = (stats.activeGames > 0) ? stats.activeGames.toLocaleString() : '1,248'

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Orbital rings */}
      {[540, 420, 300].map((s, i) => (
        <motion.div key={s} className="absolute rounded-full"
          style={{ width: s, height: s, border: '1px solid rgba(0,212,170,0.08)' }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 35 + i * 12, repeat: Infinity, ease: 'linear' }} />
      ))}
      {/* Ripple pulses */}
      {[0, 1.5, 3].map((delay, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ border: '1px solid rgba(0,212,170,0.35)' }}
          initial={{ width: 50, height: 50, opacity: 0.7 }}
          animate={{ width: 500, height: 500, opacity: 0 }}
          transition={{ duration: 4.5, repeat: Infinity, delay, ease: 'easeOut' }} />
      ))}
      {/* Radar sweep */}
      <div className="absolute" style={{ width: 300, height: 300, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: 150, height: 1.5,
            transformOrigin: '0 50%',
            background: 'linear-gradient(90deg, rgba(0,212,170,0.8), transparent)',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(0,212,170,0.12) 0deg, transparent 60deg)',
          }} />
        </motion.div>
      </div>

      {/* Globe wireframe */}
      <motion.svg width="300" height="300" viewBox="0 0 200 200" fill="none"
        stroke="#00d4aa" strokeWidth="0.55" style={{ opacity: 0.3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}>
        <circle cx="100" cy="100" r="90"/>
        <ellipse cx="100" cy="100" rx="60" ry="90"/>
        <ellipse cx="100" cy="100" rx="28" ry="90"/>
        <ellipse cx="100" cy="100" rx="90" ry="44"/>
        <ellipse cx="100" cy="100" rx="90" ry="20"/>
        <line x1="10" y1="100" x2="190" y2="100"/>
        <line x1="100" y1="10" x2="100" y2="190"/>
      </motion.svg>
      {/* Globe center */}
      <div className="absolute w-5 h-5 rounded-full"
        style={{ background: '#00d4aa', boxShadow: '0 0 0 10px rgba(0,212,170,0.12), 0 0 50px rgba(0,212,170,0.6)' }} />

      {/* ── LIVE ACTIVITY FEED ── top-center toast */}
      <AnimatePresence>
        {activity.visible && (
          <motion.div key={activity.idx} className="absolute"
            style={{ top: '5%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              borderRadius: 12, whiteSpace: 'nowrap',
              background: 'rgba(14,22,37,0.95)', border: '1px solid #1a2540',
              backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <span style={{ fontSize: 16 }}>{evt.flag}</span>
              <div>
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{evt.msg}</span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 8,
                  fontFamily: "'JetBrains Mono',monospace" }}>{evt.loc}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10 simultaneous country pins — one per PIN_ZONE slot, each cycles independently */}
      {pins.map((pin, slotIdx) => (
        <AnimatePresence key={slotIdx}>
          <motion.div key={pin.ver} className="absolute"
            style={{ top: pin.top, left: pin.left, pointerEvents: 'none', zIndex: 10 }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <motion.div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(0,212,170,0.8)', border: '1.5px solid #00d4aa',
                boxShadow: '0 0 8px rgba(0,212,170,0.6)' }}
                animate={{ scale: [1, 1.7, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: slotIdx * 0.12 }} />
              <div style={{ background: 'rgba(8,15,30,0.9)', border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap',
                fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#94a3b8',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{ALL_COUNTRIES[pin.countryIdx].flag}</span>
                {ALL_COUNTRIES[pin.countryIdx].city}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ))}

      {/* TOP-RIGHT — Active Games */}
      <motion.div className="absolute top-10 right-4 rounded-2xl px-5 py-3"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p className="text-xs font-mono" style={{ color: '#475569' }}>Active Games</p>
          {stats.activeGames > 0 && (
            <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}
        </div>
        <p className="text-3xl font-black" style={{ fontFamily: "'Syne',sans-serif", color: '#00d4aa' }}>{displayActiveGames}</p>
      </motion.div>

      {/* BOTTOM-LEFT — Countries */}
      <motion.div className="absolute bottom-16 left-4 rounded-2xl px-5 py-3"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>
        <p className="text-xs font-mono" style={{ color: '#475569' }}>Countries</p>
        <p className="text-3xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>195+</p>
      </motion.div>

      {/* TOP-LEFT — Coordinate scanner */}
      <motion.div className="absolute top-4 left-4 rounded-2xl"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)', padding: '12px 16px' }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Scanning</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={liveIdx}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.9 }}>
            <span style={{ color: '#334155' }}>LAT </span><span style={{ color: '#e2e8f0' }}>{live.lat}</span><br/>
            <span style={{ color: '#334155' }}>LNG </span><span style={{ color: '#e2e8f0' }}>{live.lng}</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* BOTTOM-RIGHT — Live Game cycling card */}
      <motion.div className="absolute bottom-4 right-4 rounded-2xl"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)', padding: '14px 18px', minWidth: 186 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', flexShrink: 0 }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live Game</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={liveIdx}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif",
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 18 }}>{live.flag}</span>{live.city}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{live.country}</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#00d4aa' }}>
              {live.lat} · {live.lng}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* BOTTOM-CENTER — Best accuracy */}
      <motion.div className="absolute rounded-2xl"
        style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,22,37,0.9)', border: '1px solid rgba(0,212,170,0.2)',
          backdropFilter: 'blur(12px)', padding: '8px 16px', whiteSpace: 'nowrap' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
          textTransform: 'uppercase', letterSpacing: '0.12em' }}>🎯 Best accuracy · </span>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#00d4aa',
          fontWeight: 700 }}>0.1 km</span>
      </motion.div>
    </div>
  )
}

/* ─── Modal wrapper ─────────────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5,9,18,0.88)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="relative w-full mx-6"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520,
          background: 'linear-gradient(160deg, #0e1625 0%, #080f1e 100%)',
          border: '1px solid #1a2540', borderRadius: 28, padding: 44,
          boxShadow: '0 50px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        <div className="absolute top-0 left-10 right-10 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,170,0.5),transparent)' }} />
        <button onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: '#475569', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
          <FiX size={16} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ─── Styled input ─────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: focused ? '#00d4aa' : '#334155' }} />}
        <input
          style={{
            width: '100%', background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${focused ? 'rgba(0,212,170,0.4)' : '#1a2540'}`,
            borderRadius: 14, padding: Icon ? '14px 16px 14px 42px' : '14px 18px',
            color: '#fff', fontSize: 14, fontFamily: "'DM Sans',sans-serif",
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
    </div>
  )
}

/* ─── Create Room modal ────────────────────────────────────────────────── */
function CreateModal({ onClose }) {
  const { socket } = useSocket()
  const { setRoom, setPlayer, setPage, pushNotification } = useGame()
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState(5)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ok = name.trim().length >= 2 && !loading

  const handle = () => {
    if (!socket || !ok) return
    setError(''); setLoading(true)
    socket.emit('create_room', { name: name.trim(), isPublic, totalRounds: rounds }, res => {
      setLoading(false)
      if (res.error) return setError(res.error)
      setPlayer({ id: socket.id, name: name.trim() })
      setRoom(res.room); setPage('lobby')
      pushNotification('Room created! Share the code with friends.', 'success')
      onClose()
    })
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <FiUsers size={20} style={{ color: '#00d4aa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 2 }}>Create a Room</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Set up your game and invite friends</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Your Name" icon={FiUsers} placeholder="e.g. MapMaster42"
          value={name} onChange={e => setName(e.target.value)} maxLength={20}
          onKeyDown={e => e.key === 'Enter' && handle()} />

        <div>
          <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4 }}>
            Rounds per team
          </label>
          <p style={{ fontSize: 11, color: '#334155', marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>
            Each team plays this many rounds (both teams play alternately)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[3,5,7,10].map(r => (
              <button key={r} onClick={() => setRounds(r)}
                style={{
                  padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', transition: 'all 0.15s',
                  border: rounds === r ? '1px solid #00d4aa' : '1px solid #1a2540',
                  background: rounds === r ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.02)',
                  color: rounds === r ? '#00d4aa' : '#475569',
                  boxShadow: rounds === r ? '0 0 20px rgba(0,212,170,0.15)' : 'none',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.025)', border: '1px solid #1a2540', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isPublic ? <FiUnlock size={16} style={{ color: '#00d4aa' }} /> : <FiLock size={16} style={{ color: '#475569' }} />}
            <div>
              <p style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{isPublic ? 'Public Room' : 'Private Room'}</p>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{isPublic ? 'Anyone can discover and join' : 'Only joinable via room code'}</p>
            </div>
          </div>
          <button onClick={() => setIsPublic(v => !v)}
            style={{ width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: isPublic ? '#00d4aa' : '#1e2d45', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transform: isPublic ? 'translateX(24px)' : 'translateX(3px)', transition: 'transform 0.25s' }} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
            borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#f87171' }}>{error}</div>
        )}

        <button onClick={handle} disabled={!ok}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', borderRadius: 16, border: 'none', cursor: ok ? 'pointer' : 'not-allowed',
            fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '0.02em',
            background: ok ? '#00d4aa' : '#1a2540', color: ok ? '#050912' : '#334155',
            boxShadow: ok ? '0 0 50px rgba(0,212,170,0.35)' : 'none',
            transition: 'all 0.2s', marginTop: 4,
          }}
          onMouseEnter={e => ok && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          {loading ? <FiLoader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FiArrowRight size={18} />}
          {loading ? 'Creating Room…' : 'Create Room'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Join Room modal ──────────────────────────────────────────────────── */
function JoinModal({ onClose, initialCode = '' }) {
  const { socket } = useSocket()
  const { setRoom, setPlayer, setPage, pushNotification } = useGame()
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const ok = name.trim().length >= 2 && code.length >= 4 && !loading

  const handle = () => {
    if (!socket || !ok) return
    setError(''); setLoading(true)
    socket.emit('join_room', { name: name.trim(), code: code.trim().toUpperCase() }, res => {
      setLoading(false)
      if (res.error) return setError(res.error)
      setPlayer({ id: socket.id, name: name.trim() })
      setRoom(res.room); setPage('lobby')
      pushNotification(`Joined room ${res.room.code}!`, 'success')
      onClose()
    })
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', flexShrink: 0 }}>
          <FiHash size={20} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 2 }}>Join a Room</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Enter the room code from your friend</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Your Name" icon={FiUsers} placeholder="e.g. GlobeHunter"
          value={name} onChange={e => setName(e.target.value)} maxLength={20} />

        <div>
          <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>
            Room Code
          </label>
          <input
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
              fontSize: 36, letterSpacing: '0.35em', color: '#fff',
              background: 'rgba(255,255,255,0.025)', outline: 'none',
              border: `1px solid ${focused ? 'rgba(0,212,170,0.45)' : '#1a2540'}`,
              borderRadius: 16, padding: '22px 16px', textTransform: 'uppercase',
              transition: 'border-color 0.2s',
            }}
            placeholder="XXXXXX"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
            borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#f87171' }}>{error}</div>
        )}

        <button onClick={handle} disabled={!ok}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', borderRadius: 16, border: 'none', cursor: ok ? 'pointer' : 'not-allowed',
            fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15,
            background: ok ? '#00d4aa' : '#1a2540', color: ok ? '#050912' : '#334155',
            boxShadow: ok ? '0 0 50px rgba(0,212,170,0.35)' : 'none',
            transition: 'all 0.2s', marginTop: 4,
          }}
          onMouseEnter={e => ok && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          {loading ? <FiLoader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FiArrowRight size={18} />}
          {loading ? 'Joining…' : 'Join Room'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── World fact card ───────────────────────────────────────────────────── */
function WorldFactCard() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % WORLD_FACTS.length), 5000)
    return () => clearInterval(id)
  }, [])
  const fact = WORLD_FACTS[idx]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
      style={{ marginTop: 22, background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
        borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      {/* accent bar */}
      <motion.div animate={{ backgroundColor: fact.color }} transition={{ duration: 0.6 }}
        style={{ height: 2, width: '100%' }} />
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
          style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{fact.flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#334155',
                textTransform: 'uppercase', letterSpacing: '0.12em' }}>🌍 World Fact</span>
              <div style={{ flex: 1, height: '1px', background: '#1a2540' }} />
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace', color: '#1a2540'" }}>
                {idx + 1}/{WORLD_FACTS.length}
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0',
              fontFamily: "'Syne',sans-serif", lineHeight: 1.3, marginBottom: 4 }}>{fact.fact}</p>
            <p style={{ fontSize: 11, color: '#475569', fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1.5 }}>{fact.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* progress bar */}
      <motion.div
        key={idx}
        initial={{ width: '0%' }} animate={{ width: '100%' }}
        transition={{ duration: 5, ease: 'linear' }}
        style={{ height: 2, background: fact.color, opacity: 0.3 }} />
    </motion.div>
  )
}

/* ─── Public rooms browser ──────────────────────────────────────────────── */
function PublicRooms({ onQuickJoin }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setFetchError(false)
    const url = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/public-rooms`
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setRooms(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error('[PublicRooms] fetch failed:', err); setFetchError(true); setLoading(false) })
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  const filtered = search.trim()
    ? rooms.filter(r =>
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.hostName?.toLowerCase().includes(search.toLowerCase())
      )
    : rooms

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      style={{ marginTop: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FiMap size={12} style={{ color: '#00d4aa' }} />
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Open Rooms</span>
          {rooms.length > 0 && (
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#334155',
              background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)',
              borderRadius: 99, padding: '1px 7px' }}>{rooms.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={load} title="Refresh"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: fetchError ? '#f87171' : '#334155', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'}
            onMouseLeave={e => e.currentTarget.style.color = fetchError ? '#f87171' : '#334155'}>
            <FiRefreshCw size={11} />
          </button>
          <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
      </div>

      {/* Search input — only shown when there are rooms */}
      {rooms.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code or host…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.025)',
              border: '1px solid #1a2540', borderRadius: 10, padding: '8px 12px 8px 34px',
              color: '#fff', fontSize: 12, fontFamily: "'DM Sans',sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1a2540' }}
          />
          <FiMap size={11} style={{ position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} />
        </div>
      )}

      {loading ? (
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
          borderRadius: 12, fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
          Scanning for rooms…
        </div>
      ) : fetchError ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '11px 14px', background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#f87171' }}>Could not reach server</span>
          </div>
          <button onClick={load}
            style={{ fontSize: 11, color: '#f87171', background: 'none', border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace' " }}>
            Retry
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540', borderRadius: 12 }}>
          <FiGlobe size={13} style={{ color: '#1e2d45', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#334155' }}>No public rooms right now — create one!</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
          borderRadius: 12, fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
          No rooms match "{search}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 180, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {filtered.map(r => (
            <div key={r.code}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: 'rgba(255,255,255,0.025)', border: '1px solid #1a2540',
                borderRadius: 12, transition: 'border-color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.22)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2540'}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
                fontSize: 13, color: '#00d4aa', letterSpacing: '0.1em', flexShrink: 0 }}>{r.code}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.hostName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{r.playerCount} player{r.playerCount !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#1a2540' }}>·</span>
                  <span style={{ fontSize: 10, color: '#475569' }}>{r.totalRounds} rounds</span>
                </div>
              </div>
              <button onClick={() => onQuickJoin(r.code)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid rgba(0,212,170,0.3)', cursor: 'pointer',
                  background: 'rgba(0,212,170,0.08)', color: '#00d4aa', flexShrink: 0,
                  fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}>
                <FiPlay size={9} /> Join Room
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── How it works — visual cards ──────────────────────────────────────── */
function TypewriterSignature() {
  const full = 'blackfyre'
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const cursor = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(cursor)
  }, [])

  useEffect(() => {
    let t
    if (!deleting && typed.length < full.length)
      t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 130)
    else if (!deleting && typed.length === full.length)
      t = setTimeout(() => setDeleting(true), 2800)
    else if (deleting && typed.length > 0)
      t = setTimeout(() => setTyped(full.slice(0, typed.length - 1)), 65)
    else
      t = setTimeout(() => setDeleting(false), 600)
    return () => clearTimeout(t)
  }, [typed, deleting])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
        color: 'rgba(71,85,105,0.6)', letterSpacing: '0.12em',
        textTransform: 'lowercase', userSelect: 'none',
      }}>
        crafted by
      </span>
      <span style={{
        fontFamily: "'Special Elite',cursive", fontSize: 13,
        color: '#00d4aa', userSelect: 'none',
        textShadow: '0 0 12px rgba(0,212,170,0.7)',
      }}>
        {typed}
        <span style={{ opacity: showCursor ? 1 : 0, color: '#00d4aa' }}>|</span>
      </span>
    </div>
  )
}

function HowItWorks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
      style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
      {STEPS.map((s, i) => {
        const Icon = s.icon
        return (
          <div key={i}
            style={{ flex: 1, padding: '14px', borderRadius: 16, cursor: 'default',
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
              transition: 'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.22)'; e.currentTarget.style.background = 'rgba(0,212,170,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2540'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.15)', flexShrink: 0 }}>
                <Icon size={13} style={{ color: '#00d4aa' }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#334155' }}>{s.n}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>{s.t}</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>{s.d}</div>
          </div>
        )
      })}
    </motion.div>
  )
}

/* ─── Landing Page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [modal, setModal] = useState(null)
  const [joinPrefill, setJoinPrefill] = useState('')
  const [cityIdx, setCityIdx] = useState(0)
  const [serverStats, setServerStats] = useState({ activePlayers: 0, activeGames: 0, lobbyRooms: 0 })
  const [recentEvents, setRecentEvents] = useState([])
  const [visitors, setVisitors] = useState(0)
  const { socket, connected } = useSocket()

  // Auto-open join modal when a ?code= param is present in the URL
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) { setJoinPrefill(code.toUpperCase()); setModal('join') }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCityIdx(i => (i + 1) % HERO_CITIES.length), 2500)
    return () => clearInterval(id)
  }, [])

  // Poll server stats and recent events every 10 s
  useEffect(() => {
    const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'
    const load = () => {
      fetch(`${BASE}/stats`)
        .then(r => r.json())
        .then(data => {
          setServerStats(data)
          if (data.visitors > 0) setVisitors(data.visitors)
        })
        .catch(() => {})
      fetch(`${BASE}/recent-events`)
        .then(r => r.json())
        .then(data => setRecentEvents(data))
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  // Real-time visitor count via socket event (no polling delay)
  useEffect(() => {
    if (!socket) return
    const handle = ({ count }) => setVisitors(count)
    socket.on('visitor_count', handle)
    return () => socket.off('visitor_count', handle)
  }, [socket])

  const openQuickJoin = (code) => { setJoinPrefill(code); setModal('join') }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex',
      background: '#050912', fontFamily: "'DM Sans',sans-serif", position: 'relative' }}>
      <WorldGrid />

      {/* ── LEFT ── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', width: '50%', height: '100%', padding: '28px 52px',
        overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <FiGlobe size={18} style={{ color: '#00d4aa' }} />
            </div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', fontSize: 16 }}>
              GEOHIDERS.COM
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {visitors > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540' }}>
                <FiUsers size={11} style={{ color: '#475569' }} />
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569' }}>
                  {visitors.toLocaleString()} online
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%',
                background: connected ? '#00d4aa' : '#f87171',
                boxShadow: connected ? '0 0 8px #00d4aa' : 'none',
                animation: connected ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
                color: connected ? '#00d4aa' : '#f87171' }}>
                {connected ? 'Server Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div>
          <motion.div initial="h" animate="v" variants={{ h: {}, v: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#00d4aa', background: 'rgba(0,212,170,0.08)',
                border: '1px solid rgba(0,212,170,0.15)', borderRadius: 99, padding: '7px 16px' }}>
                Multiplayer · Real-World · Location Battle
              </span>
            </motion.div>

            <h1 style={{ lineHeight: 1.0, marginBottom: 16, fontFamily: "'Syne',sans-serif", fontWeight: 900,
                fontSize: 'clamp(52px, 6vw, 96px)', letterSpacing: '-2px', display: 'flex' }}>

                {/* Geo — fades + slides up from below */}
                <motion.span
                  initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ color: '#fff' }}
                >
                  Geo
                </motion.span>

                {/* Hiders — each letter bounces up staggered, then whole word glows on loop */}
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 0px rgba(0,212,170,0)',
                      '0 0 24px rgba(0,212,170,0.9), 0 0 48px rgba(0,212,170,0.35)',
                      '0 0 0px rgba(0,212,170,0)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}
                  style={{ color: '#00d4aa', display: 'inline-flex' }}
                >
                  {'Hiders'.split('').map((l, i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 60, opacity: 0, filter: 'blur(6px)' }}
                      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {l}
                    </motion.span>
                  ))}
                </motion.span>
            </h1>

            <motion.p variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ fontSize: 15, lineHeight: 1.7, color: '#64748b', maxWidth: 400, marginBottom: 10 }}>
              One team hides inside a real Google Street View location.
              The other team decodes clues and pins the exact spot on a world map.
            </motion.p>

            {/* ── Animated city subtitle ── */}
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Can you find</span>
              <AnimatePresence mode="wait">
                <motion.span key={cityIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa',
                    fontFamily: "'JetBrains Mono',monospace" }}>
                  {HERO_CITIES[cityIdx]}?
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => setModal('create')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                  fontWeight: 900, fontSize: 15, background: '#00d4aa', color: '#050912',
                  boxShadow: '0 0 60px rgba(0,212,170,0.4)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 70px rgba(0,212,170,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 60px rgba(0,212,170,0.4)' }}>
                <FiUsers size={18} /> Create Room <FiChevronRight size={16} />
              </button>

              <button onClick={() => { setJoinPrefill(''); setModal('join') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 18, cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                  fontWeight: 900, fontSize: 15, color: '#fff',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)'; e.currentTarget.style.background = 'rgba(0,212,170,0.05)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2540'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none' }}>
                <FiHash size={18} /> Join Room
              </button>
            </motion.div>
          </motion.div>

          {/* ── World fact card ── */}
          <WorldFactCard />

          {/* ── Public rooms ── */}
          <PublicRooms onQuickJoin={openQuickJoin} />
        </div>

        {/* ── How it works — cards ── */}
        <HowItWorks />
      </div>

      {/* ── RIGHT ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 24, borderRadius: 28,
          background: 'rgba(14,22,37,0.35)', border: '1px solid rgba(26,37,64,0.7)', backdropFilter: 'blur(6px)' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: 40, display: 'flex', flexDirection: 'column' }}>
          <AnimatedGlobe stats={serverStats} recentEvents={recentEvents} />

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 12 }}>
            {[
              { value: '10K+',   label: 'Games Played' },
              { value: '195',    label: 'Countries' },
              { value: '3.4K+',  label: 'Total Players' },
              { value: '0.1 km', label: 'Best Accuracy' },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{ flex: 1, background: 'rgba(14,22,37,0.85)', border: '1px solid #1a2540',
                  borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900,
                  color: '#00d4aa', fontSize: 16, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Scrolling world ticker */}
          <div style={{ overflow: 'hidden', flexShrink: 0, marginTop: 10,
            borderTop: '1px solid #0f1a2e', paddingTop: 8 }}>
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap' }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{ fontSize: 10, color: '#334155',
                  fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          <TypewriterSignature />
        </div>
      </div>

      <AnimatePresence>
        {modal === 'create' && <CreateModal onClose={() => setModal(null)} />}
        {modal === 'join'   && <JoinModal   onClose={() => setModal(null)} initialCode={joinPrefill} />}
      </AnimatePresence>

    </div>
  )
}
