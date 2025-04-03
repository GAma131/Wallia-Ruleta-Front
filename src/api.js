// ... existing code ...

import axios from 'axios';

// Update the base URL for axios
const apiClient = axios.create({
  baseURL: 'https://walia-ruleta-back.onrender.com',
});

// Example function using the updated base URL
export function fetchParticipants() {
  return apiClient.get('/participants');
}

// ... existing code ...