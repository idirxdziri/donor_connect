#!/usr/bin/env node

// Complete mobile app test - tests API connectivity and basic functionality
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE_URL = "https://localhost:57679";

async function testBackendConnection() {
  console.log("🔧 Testing Backend Connection...");

  try {
    const response = await fetch(`${API_BASE_URL}/swagger/index.html`);
    if (response.ok) {
      console.log("✅ Backend is reachable");
    } else {
      console.log("❌ Backend returned status:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Backend connection failed:", error.message);
    return false;
  }

  return true;
}

async function testCoreAPIs() {
  console.log("\n📡 Testing Core API Endpoints...");

  const endpoints = [
    { path: '/BloodDonationRequests', key: 'bloodDonationRequests', name: 'Blood Requests' },
    { path: '/BTC', key: 'bloodTansfusionCenters', name: 'Blood Centers' },
    { path: '/Wilayas', key: null, name: 'Wilayas' }
  ];

  let allSuccess = true;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const count = endpoint.key ? data[endpoint.key]?.length : data.length;
        console.log(`✅ ${endpoint.name}: ${count || 0} items`);
      } else {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
        allSuccess = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      allSuccess = false;
    }
  }

  return allSuccess;
}

async function testMobileAPIService() {
  console.log("\n📱 Testing Mobile API Service...");

  try {
    // Test using direct fetch calls to match our TypeScript service
    const API_BASE_URL = "https://localhost:57679";

    console.log("  Testing BloodDonationRequests endpoint...");
    const requestsResponse = await fetch(`${API_BASE_URL}/BloodDonationRequests`, {
      headers: { 'Accept': 'application/json' }
    });
    if (requestsResponse.ok) {
      const requestsData = await requestsResponse.json();
      console.log(`  ✅ ${requestsData.bloodDonationRequests?.length || 0} blood donation requests`);
    } else {
      throw new Error(`HTTP ${requestsResponse.status}`);
    }

    console.log("  Testing Wilayas endpoint...");
    const wilayasResponse = await fetch(`${API_BASE_URL}/Wilayas`, {
      headers: { 'Accept': 'application/json' }
    });
    if (wilayasResponse.ok) {
      const wilayasData = await wilayasResponse.json();
      console.log(`  ✅ ${wilayasData.length || 0} wilayas`);
    } else {
      throw new Error(`HTTP ${wilayasResponse.status}`);
    }

    console.log("  Testing BTC endpoint...");
    const centersResponse = await fetch(`${API_BASE_URL}/BTC`, {
      headers: { 'Accept': 'application/json' }
    });
    if (centersResponse.ok) {
      const centersData = await centersResponse.json();
      console.log(`  ✅ ${centersData.bloodTansfusionCenters?.length || 0} blood transfusion centers`);
    } else {
      throw new Error(`HTTP ${centersResponse.status}`);
    }

    return true;

  } catch (error) {
    console.log("  ❌ Mobile API service failed:", error.message);
    return false;
  }
}

async function checkExpoServer() {
  console.log("\n🚀 Checking Expo Development Server...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('http://localhost:8082', {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      console.log("✅ Expo server is running on port 8082");
      return true;
    }
  } catch (error) {
    console.log("⚠️ Expo server not running on port 8082");
    console.log("   To start: npx expo start --port 8082");
    return false;
  }
}

async function main() {
  console.log("🩸 MOBILE BLOOD DONATION APP - COMPLETE TEST\n");
  console.log("==================================================");

  let overallSuccess = true;

  // Test backend connection
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    console.log("\n❌ Backend tests failed. Please ensure the .NET API server is running.");
    overallSuccess = false;
  }

  // Test core APIs
  if (backendOk) {
    const apisOk = await testCoreAPIs();
    if (!apisOk) {
      console.log("\n⚠️ Some API endpoints failed.");
      overallSuccess = false;
    }
  }

  // Test mobile API service
  if (backendOk) {
    const mobileApiOk = await testMobileAPIService();
    if (!mobileApiOk) {
      console.log("\n❌ Mobile API service failed.");
      overallSuccess = false;
    }
  }

  // Check Expo server
  await checkExpoServer();

  // Final status
  console.log("\n==================================================");
  if (overallSuccess) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("✅ Mobile app is ready for testing");
    console.log("📱 Scan QR code with Expo Go to test on device");
    console.log("🌐 Or press 'w' in Expo CLI to test in browser");
  } else {
    console.log("❌ Some tests failed. Please check the issues above.");
  }
  console.log("==================================================");
}

main().catch(console.error);
