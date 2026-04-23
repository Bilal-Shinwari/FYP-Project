// API base URL — override from browser console for Colab/ngrok:
//   localStorage.setItem('api_base', 'https://xxxx.ngrok-free.app')
//   then refresh the page
export const API_BASE = localStorage.getItem('api_base') || 'http://localhost:8000';
