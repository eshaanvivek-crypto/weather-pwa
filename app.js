const weatherApi = 'https://api.open-meteo.com/v1/forecast';
const geocodingApi = 'https://geocoding-api.open-meteo.com/v1/search';

const elements = {
  form: document.querySelector('#search-form'),
  cityInput: document.querySelector('#city-input'),
  locationButton: document.querySelector('#location-button'),
  status: document.querySelector('#status'),
  weather: document.querySelector('#weather'),
  location: document.querySelector('#location'),
  icon: document.querySelector('#weather-icon'),
  temperature: document.querySelector('#temperature'),
  condition: document.querySelector('#condition'),
  high: document.querySelector('#high'),
  low: document.querySelector('#low'),
  wind: document.querySelector('#wind'),
  updated: document.querySelector('#updated')
};

const weatherCodes = {
  0: ['☀️', 'Clear sky'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'], 48: ['🌫️', 'Rime fog'], 51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
  61: ['🌦️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'], 71: ['🌨️', 'Light snow'], 73: ['❄️', 'Snow'],
  75: ['❄️', 'Heavy snow'], 80: ['🌦️', 'Rain showers'], 81: ['🌧️', 'Rain showers'], 82: ['⛈️', 'Heavy rain showers'],
  95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm with hail'], 99: ['⛈️', 'Thunderstorm with hail']
};

function setBusy(isBusy, message = '') {
  elements.form.querySelector('button').disabled = isBusy;
  elements.locationButton.disabled = isBusy;
  if (message) elements.status.textContent = message;
}

function showError(message) {
  elements.status.textContent = message;
  elements.weather.classList.add('hidden');
}

async function getWeather(latitude, longitude, placeName) {
  setBusy(true, 'Loading weather…');
  try {
    const params = new URLSearchParams({ latitude, longitude, current: 'temperature_2m,weather_code,wind_speed_10m', daily: 'temperature_2m_max,temperature_2m_min', temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', timezone: 'auto', forecast_days: '1' });
    const response = await fetch(`${weatherApi}?${params}`);
    if (!response.ok) throw new Error('Weather request failed.');
    const data = await response.json();
    renderWeather(data, placeName);
  } catch (error) {
    showError('Could not load weather. Please try again.');
  } finally {
    setBusy(false);
  }
}

function renderWeather(data, placeName) {
  const current = data.current;
  const daily = data.daily;
  const [icon, condition] = weatherCodes[current.weather_code] || ['🌡️', 'Current conditions'];
  elements.location.textContent = placeName;
  elements.icon.textContent = icon;
  elements.temperature.textContent = `${Math.round(current.temperature_2m)}°F`;
  elements.condition.textContent = condition;
  elements.high.textContent = `${Math.round(daily.temperature_2m_max[0])}°F`;
  elements.low.textContent = `${Math.round(daily.temperature_2m_min[0])}°F`;
  elements.wind.textContent = `${Math.round(current.wind_speed_10m)} mph`;
  elements.updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  elements.status.textContent = '';
  elements.weather.classList.remove('hidden');
}

async function searchCity(city) {
  setBusy(true, 'Finding city…');
  try {
    const response = await fetch(`${geocodingApi}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!response.ok) throw new Error('Location request failed.');
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) throw new Error('City not found.');
    const placeName = [result.name, result.country_code].filter(Boolean).join(', ');
    await getWeather(result.latitude, result.longitude, placeName);
  } catch (error) {
    showError(error.message === 'City not found.' ? error.message : 'Could not find that city.');
    setBusy(false);
  }
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = elements.cityInput.value.trim();
  if (city) searchCity(city);
});

elements.locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Location is not supported by this browser.');
    return;
  }
  setBusy(true, 'Requesting your location…');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => getWeather(coords.latitude, coords.longitude, 'Your location'),
    () => { setBusy(false); showError('Location permission was denied. Search for a city instead.'); },
    { enableHighAccuracy: false, timeout: 10000 }
  );
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
