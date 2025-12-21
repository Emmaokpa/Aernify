import Link from 'next/link';

export default function Logo({
  href = '/',
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <h1 className="text-2xl font-bold text-foreground">Aernify</h1>
    </Link>
  );
}
