type Props = {
  label: string;
  value: string | number;
};

export function Row({ label, value }: Props) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="pr-6 text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}