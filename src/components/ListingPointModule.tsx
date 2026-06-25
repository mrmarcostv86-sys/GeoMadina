import React from "react";
import { Point } from "../types";
import { Grid } from "lucide-react";

interface ListingPointModuleProps {
  pointsList: Point[];
  onEditPoint: (pt: Point) => void;
  onDeletePoint: (pointId: string) => void;
  onUploadPoints: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ListingPointModule({ pointsList, onEditPoint, onDeletePoint, onUploadPoints }: ListingPointModuleProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
        <Grid className="text-indigo-400 w-5 h-5" />
        <span>Gestion Sommets du Projet</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-left">
            <tr>
              <th className="p-2">Nom</th>
              <th className="p-2">X</th>
              <th className="p-2">Y</th>
              <th className="p-2">Z</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {pointsList.map((pt) => (
              <tr key={pt.id}>
                <td className="p-2">{pt.name}</td>
                <td className="p-2">{pt.x.toFixed(3)}</td>
                <td className="p-2">{pt.y.toFixed(3)}</td>
                <td className="p-2">{pt.z.toFixed(2)}</td>
                <td className="p-2 text-center flex justify-center gap-2">
                  <button onClick={() => onEditPoint(pt)} className="text-indigo-400 hover:text-white">Edit</button>
                  <button onClick={() => onDeletePoint(pt.id)} className="text-red-400 hover:text-white">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <input type="file" onChange={onUploadPoints} className="hidden" id="upload-points" />
        <label htmlFor="upload-points" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer">Upload</label>
        <button onClick={() => {
          const data = pointsList.map(p => `${p.name},${p.x},${p.y},${p.z}`).join("\n");
          const blob = new Blob([data], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "points.csv";
          a.click();
        }} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer">Download CSV</button>
      </div>
    </div>
  );
}
