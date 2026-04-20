import TutorFloatingMenu from '../../components/TutorFloatingMenu';

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* ✨ ฝังเมนูลอยไว้ตรงนี้ มันจะโผล่ทุกหน้าอัตโนมัติ (ยกเว้นหน้าหลัก) */}
      <TutorFloatingMenu />
    </>
  );
}