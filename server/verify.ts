import { getAllBookings } from './src/services/booking.service.js';
import { getReportSummary } from './src/services/report.service.js';
import { getAllVehicles } from './src/services/vehicle.service.js';
import { getWfoSchedulesByDate } from './src/services/wfo.service.js';
import { db } from './src/config/db.js';

async function verify() {
  console.log('--- Starting Verification ---');
  try {
    console.log('1. Testing getReportSummary...');
    const report = await getReportSummary();
    console.log('✅ getReportSummary works. Data:', report);

    console.log('2. Testing getAllVehicles...');
    const vehicles = await getAllVehicles();
    console.log(`✅ getAllVehicles works. Count: ${vehicles.length}`);

    console.log('3. Testing getWfoSchedulesByDate...');
    const wfo = await getWfoSchedulesByDate('2026-06-05');
    console.log(`✅ getWfoSchedulesByDate works. Count: ${wfo.length}`);

    console.log('4. Testing getAllBookings...');
    const bookings = await getAllBookings();
    console.log(`✅ getAllBookings works. Count: ${bookings.length}`);

    console.log('--- All Tests Passed ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  }
}

verify();
