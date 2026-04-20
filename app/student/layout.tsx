import StudentFloatingMenu from '../../components/StudentFloatingMenu';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* ฝังเมนูลอยไว้ตรงนี้ มันจะโผล่ทุกหน้าอัตโนมัติ */}
      <StudentFloatingMenu />
    </>
  );
}