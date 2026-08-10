// Test the exact logic used in the backend
function testTimezoneLogic() {
  console.log("=== Testing Backend Timezone Logic ===");
  
  const now = new Date();
  console.log("Original UTC time:", now.toUTCString());
  
  // Replicate the backend logic exactly
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pacificOffset = -7; // PDT is UTC-7
  const pacificTime = new Date(utcTime + (pacificOffset * 3600000));
  
  console.log("Calculated Pacific time:", pacificTime.toString());
  console.log("Pacific hour:", pacificTime.getHours());
  console.log("Pacific minute:", pacificTime.getMinutes());
  
  const currentTime = pacificTime.getHours() * 60 + pacificTime.getMinutes();
  console.log("Current time in minutes:", currentTime);
  
  // Test against some restaurants
  console.log("\n=== Restaurant Tests ===");
  
  // World Foods: 10 am–7:30 pm (should be closed at ~9:35 AM)
  const worldFoodsOpen = 10 * 60; // 600 minutes
  console.log(`World Foods (opens 10 AM): ${currentTime >= worldFoodsOpen ? 'OPEN' : 'CLOSED'} (${currentTime} >= ${worldFoodsOpen})`);
  
  // Von Ebert: 11:30 am–9 pm (should be closed at ~9:35 AM)
  const vonEbertOpen = 11 * 60 + 30; // 690 minutes  
  console.log(`Von Ebert (opens 11:30 AM): ${currentTime >= vonEbertOpen ? 'OPEN' : 'CLOSED'} (${currentTime} >= ${vonEbertOpen})`);
  
  // Take Two: 3 pm–12 am (should be closed at ~9:35 AM)
  const takeTwoOpen = 15 * 60; // 900 minutes (3 PM)
  console.log(`Take Two (opens 3 PM): ${currentTime >= takeTwoOpen ? 'OPEN' : 'CLOSED'} (${currentTime} >= ${takeTwoOpen})`);
}

testTimezoneLogic();