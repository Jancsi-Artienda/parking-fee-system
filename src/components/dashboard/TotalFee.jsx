export default function TotalFeeStatCard({ totalFee }) {
  const numericTotal =
    typeof totalFee === "number"
      ? totalFee
      : Number.isFinite(Number(totalFee))
        ? Number(totalFee)
        : null;

  const displayValue =
    numericTotal == null
      ? "0"
      : `${numericTotal.toLocaleString("en-US")}`;

  return (
    <div className="bg-white rounded-2xl shadow-md w-full p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 text-center ">TOTAL FEE:</p>
          <p className="text-4xl font-bold text-center mt-1">{displayValue}</p>
        </div>
      </div>
    </div>
  );
}
