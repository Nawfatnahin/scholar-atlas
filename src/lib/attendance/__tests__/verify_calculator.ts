import { calculateStats, Subject, AttendanceRecord } from '../calculator';

const mockSubject: Subject = {
  id: '1',
  name: 'Test Subject',
  required_threshold: 75,
  personal_target: null,
  total_classes_planned: 40
};

const mockRecords: AttendanceRecord[] = [
  { absence_type: 'present', class_date: '2026-05-01' },
  { absence_type: 'present', class_date: '2026-05-02' },
  { absence_type: 'present', class_date: '2026-05-03' },
  { absence_type: 'unexcused', class_date: '2026-05-04' },
  { absence_type: 'cancelled', class_date: '2026-05-05' },
];

const stats = calculateStats(mockSubject, mockRecords);

console.log('--- Attendance Stats Verification ---');
console.log(`Subject: ${stats.subjectName}`);
console.log(`Total Classes: ${stats.totalClasses} (Expected: 4)`);
console.log(`Attended: ${stats.attended} (Expected: 3)`);
console.log(`Percentage: ${stats.currentPercentage}% (Expected: 75%)`);
console.log(`Safe Skips Left: ${stats.safeSkipsLeft} (Expected: 0)`);
console.log(`Health Status: ${stats.healthStatus} (Expected: danger)`);

if (stats.totalClasses === 4 && stats.attended === 3 && stats.currentPercentage === 75 && stats.healthStatus === 'danger') {
  console.log('✅ Verification Passed');
} else {
  console.log('❌ Verification Failed');
  process.exit(1);
}
