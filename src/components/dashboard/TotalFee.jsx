import { Percent } from "lucide-react";

export default function TotalFeeStatCard({ totalFee }) {
    return (

        <div className="bg-white rounded-2xl shadow-md w-full p-5 transition-transform duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm text-gray-500 text-center ">TOTAL FEE:</p>
                    <p className="text-4xl font-bold text-center mt-1">{totalFee}</p>
                </div>
               
               
            </div>
        </div>
    );
}