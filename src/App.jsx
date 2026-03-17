import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // This is empty now
import { 
  Search, Sun, Cloud, CloudRain, CloudSnow, 
  CloudLightning, CloudDrizzle, CloudFog, CloudSun,
  Wind, Droplets, Thermometer, Gauge, MapPin 
} from 'lucide-react';

const WMO_CODES = {
  0: { label: 'Clear sky', Icon: Sun },
  1: { label: 'Mainly clear', Icon: Sun },
  2: { label: 'Partly cloudy', Icon: CloudSun },
  3: { label: 'Overcast', Icon: Cloud },
  45: { label: 'Fog', Icon: CloudFog },
  48: { label: 'Depositing rime fog', Icon: CloudFog },
  51: { label: 'Light drizzle', Icon: CloudRain },
  53: { label: 'Moderate drizzle', Icon: CloudRain },
  55: { label: 'Dense drizzle', Icon: CloudRain },
  61: { label: 'Slight rain', Icon: CloudRain },
  63: { label: 'Moderate rain', Icon: CloudDrizzle },
  65: { label: 'Heavy rain', Icon: CloudDrizzle },
  71: { label: 'Slight snow', Icon: CloudSnow },
  73: { label: 'Moderate snow', Icon: CloudSnow },
  75: { label: 'Heavy snow', Icon: CloudSnow },
  95: { label: 'Thunderstorm', Icon: CloudLightning },
  96: { label: 'Thunderstorm', Icon: CloudLightning },
  99: { label: 'Heavy Thunderstorm', Icon: CloudLightning },
};

export default function App() {
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const searchContainerRef = useRef(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    let timeoutId;
    
    if (city.trim() && showSuggestions) {
      timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.results || []);
          }
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
        }
      }, 300); // 300ms delay to prevent too many API calls
    } else {
      setSuggestions([]);
    }

    return () => clearTimeout(timeoutId);
  }, [city, showSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion.name);
    setShowSuggestions(false);
    fetchWeatherForLocation(suggestion);
  };

  const fetchWeather = async (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (!city.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (!geoRes.ok) throw new Error('Failed to fetch location data');
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found. Please try another name.');
      }

      await fetchWeatherForLocation(geoData.results[0]);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchWeatherForLocation = async ({ latitude, longitude, name, country }) => {
    setLoading(true);
    setError(null);
    setWeatherData(null); // Clear previous data while loading

    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=7`);
      
      if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
      const weatherResult = await weatherRes.json();

      setWeatherData({
        location: { name, country },
        current: weatherResult.current,
        daily: weatherResult.daily
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    
    // Simplification to label today
    const diffTime = Math.round((date.getTime() - today.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    
    if (diffTime === 0) return 'Today';
    // Use proper locale day names for other days (e.g. Mon, Tue)
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header & Search Bar */}
        <div className="text-center pt-8 pb-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-4 drop-shadow-lg">
            <CloudSun className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400" />
            Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Flow</span>
          </h1>
          <p className="text-indigo-200/80 text-lg">Search locations to discover present and past weather trends</p>
        </div>

        <form onSubmit={fetchWeather} className="relative max-w-2xl mx-auto" ref={searchContainerRef}>
          <div className="relative group z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-white/20">
              <input
                type="text"
                placeholder="Enter city name (e.g. London, Tokyo)"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent px-8 py-5 outline-none text-xl text-white placeholder-slate-400"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-5 text-indigo-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? <div className="w-6 h-6 border-2 border-indigo-400 border-t-white rounded-full animate-spin"></div> : <Search className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-4">
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={`${suggestion.id}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-6 py-4 hover:bg-indigo-500/20 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-white font-medium">{suggestion.name}</span>
                      {suggestion.admin1 && <span className="text-slate-400 text-sm ml-2">{suggestion.admin1},</span>}
                      <span className="text-slate-400 text-sm ml-2">{suggestion.country}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}
        </form>

        {/* Weather Content */}
        {weatherData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Current Weather Main Card */}
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:bg-slate-800/60 transition-colors relative overflow-hidden group">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-indigo-300 mb-10 bg-indigo-500/10 w-fit px-4 py-2 rounded-full border border-indigo-500/20">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-medium tracking-wide truncate">
                    {weatherData.location.name}, {weatherData.location.country}
                  </h2>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-40 h-40 mb-6 text-cyan-400 filter drop-shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-transform hover:scale-110 duration-500">
                    {(() => {
                      const CurrentIcon = (WMO_CODES[weatherData.current.weather_code] || WMO_CODES[3]).Icon;
                      return <CurrentIcon className="w-full h-full" strokeWidth={1.5} />;
                    })()}
                  </div>
                  <div className="text-8xl font-black tracking-tighter mb-4 flex items-start">
                    {Math.round(weatherData.current.temperature_2m)}
                    <span className="text-4xl text-slate-400 mt-2">°</span>
                  </div>
                  <div className="text-2xl text-indigo-200 capitalize font-medium flex items-center justify-center gap-2">
                    {(WMO_CODES[weatherData.current.weather_code] || WMO_CODES[3]).label}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Weather Details & Daily Forecast Strip */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Top Row: Weather metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-slate-800/60 transition-colors group">
                  <div className="p-3 bg-orange-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Thermometer className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Feels Like</div>
                    <div className="text-3xl font-bold">{Math.round(weatherData.current.apparent_temperature)}°</div>
                  </div>
                </div>
                
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-slate-800/60 transition-colors group">
                  <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Droplets className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Humidity</div>
                    <div className="text-3xl font-bold">{weatherData.current.relative_humidity_2m}%</div>
                  </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-slate-800/60 transition-colors group">
                  <div className="p-3 bg-teal-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Wind className="w-8 h-8 text-teal-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Wind Speed</div>
                    <div className="text-xl font-bold whitespace-nowrap">{weatherData.current.wind_speed_10m} km/h</div>
                  </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-slate-800/60 transition-colors group">
                  <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Gauge className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Pressure</div>
                    <div className="text-xl font-bold">{weatherData.current.surface_pressure} hPa</div>
                  </div>
                </div>
              </div>

              {/* Bottom section: Daily Forecast Strip (Past and future) */}
              <div className="flex-grow bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] pt-8 pb-6 px-4 hover:bg-slate-800/50 transition-colors">
                <h3 className="px-4 text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <span className="p-2 bg-indigo-500/20 rounded-xl">
                     <CloudSnow className="w-5 h-5 text-indigo-400" />
                  </span>
                  Extended Outlook (Past 7 Days & Forecast)
                </h3>
                
                <div className="px-4 flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar scroll-smooth">
                  {weatherData.daily.time.map((date, i) => {
                    const DayIcon = (WMO_CODES[weatherData.daily.weather_code[i]] || WMO_CODES[3]).Icon;
                    const dayLabel = getDayName(date);
                    const isToday = dayLabel === 'Today';
                    
                    const time = new Date(date).setHours(0,0,0,0);
                    const now = new Date().setHours(0,0,0,0);
                    const isPast = time < now;
                    
                    return (
                      <div 
                        key={date} 
                        className={`min-w-[120px] flex-shrink-0 snap-center rounded-[2rem] flex flex-col items-center p-6 border transition-all ${
                          isToday 
                            ? 'bg-gradient-to-b from-indigo-500/30 to-slate-800/50 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                            : 'bg-slate-800/30 border-white/5 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className={`text-base font-bold mb-1 ${isToday ? 'text-white' : 'text-slate-200'}`}>
                          {dayLabel}
                        </span>
                        
                        <span className={`text-xs font-medium uppercase tracking-wider mb-4 px-2 py-1 rounded-md ${
                          isToday ? 'bg-indigo-500/20 text-indigo-300' : 
                          isPast ? 'bg-slate-700/50 text-slate-400' : 'bg-transparent text-slate-500'
                        }`}>
                          {isToday ? 'Present' : isPast ? 'Past' : 'Future'}
                        </span>
                        
                        <div className={`mb-4 transition-transform ${isToday ? 'scale-125' : 'hover:scale-110'}`}>
                          <DayIcon className={`w-10 h-10 ${isToday ? 'text-indigo-400' : isPast ? 'text-slate-500' : 'text-slate-300'}`} />
                        </div>
                        
                        <div className="flex items-center gap-3 text-base font-bold">
                          <span className={`${isToday ? 'text-white' : 'text-slate-200'}`}>{Math.round(weatherData.daily.temperature_2m_max[i])}°</span>
                          <span className={`${isToday ? 'text-indigo-200' : 'text-slate-500'}`}>{Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
      
      {/* Hide scrollbar utility class injected quickly via style */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />
    </div>
  );
}
