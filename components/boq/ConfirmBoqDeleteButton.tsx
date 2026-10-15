"use client";

export default function ConfirmBoqDeleteButton({boqNumber,description}:{boqNumber:string;description:string}) {
  return <button type="submit" className="font-medium text-red-600 hover:underline" onClick={(event)=>{
    if(!window.confirm(`Delete BOQ item ${boqNumber} — ${description.slice(0,100)}?\n\nThis action cannot be undone.`)) event.preventDefault();
  }}>Delete</button>;
}
