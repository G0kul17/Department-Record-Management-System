// Test hackathons endpoint
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const response = await fetch('http://localhost:5000/api/hackathons?mine=true&limit=100');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
