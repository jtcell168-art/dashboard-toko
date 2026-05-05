import { getCurrentUser } from "@/app/actions/auth";
import { getTodayAttendance } from "@/app/actions/attendance";
import AttendanceClient from "./AttendanceClient";

export const metadata = {
  title: "Absensi Harian | JT Cell Group",
};

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: attendance } = await getTodayAttendance();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Absensi Harian</h1>
        <p className="text-gray-400">
          Silakan melakukan absensi sesuai dengan jam kerja.
          <br/>
          Jam Masuk: <span className="text-white font-medium">09:00</span> | 
          Istirahat: <span className="text-white font-medium">12:00 - 13:50</span> | 
          Jam Pulang: <span className="text-white font-medium">21:00</span>
        </p>
      </div>

      <AttendanceClient user={user} initialAttendance={attendance || null} />
    </div>
  );
}
