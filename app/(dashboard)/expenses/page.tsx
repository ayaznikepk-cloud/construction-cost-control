import Link from "next/link";
import ExpenseEntryForm from "@/components/expenses/ExpenseEntryForm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pkr } from "@/lib/format";

const textValue=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const numberValue=(f:FormData,k:string)=>{const v=Number(f.get(k));return Number.isFinite(v)?v:null};

async function createExpense(formData:FormData){"use server";
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("Sign in required.");
  const projectId=textValue(formData,"project_id"), categoryId=textValue(formData,"expense_category_id");
  const classification=textValue(formData,"classification"), boqItemId=textValue(formData,"boq_item_id")||null;
  const expenseDate=textValue(formData,"expense_date"), amount=numberValue(formData,"amount");
  if(!projectId||!categoryId||!expenseDate||amount===null||amount<=0) throw new Error("Project, category, date and positive amount are required.");
  if(!["direct_boq","overhead"].includes(classification)) throw new Error("Select a valid cost classification.");
  if(classification==="direct_boq"&&!boqItemId) throw new Error("Direct BOQ cost requires a BOQ item.");
  const {error}=await supabase.from("expenses").insert({
    project_id:projectId, expense_number:textValue(formData,"expense_number")||null, expense_date:expenseDate,
    expense_category_id:categoryId, classification, boq_item_id:boqItemId,
    payee:textValue(formData,"payee")||null, description:textValue(formData,"description")||null,
    amount, payment_method:textValue(formData,"payment_method")||null, paid_from:textValue(formData,"paid_from")||null,
    status:"posted", entered_by:user.id
  });
  if(error) throw new Error(error.message);
  revalidatePath("/expenses"); revalidatePath("/dashboard"); revalidatePath("/projects/"+projectId+"/overview");
}

async function addCategory(formData:FormData){"use server";
  const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Sign in required.");
  const {data:profile}=await supabase.from("users").select("org_id").eq("id",user.id).maybeSingle();
  const name=textValue(formData,"name"), defaultClassification=textValue(formData,"default_classification");
  if(!profile?.org_id||!name||!["direct_boq","overhead"].includes(defaultClassification)) throw new Error("Category name and classification are required.");
  const {error}=await supabase.from("expense_categories").insert({org_id:profile.org_id,name,default_classification:defaultClassification});
  if(error) throw new Error(error.message); revalidatePath("/expenses");
}

export default async function ExpensesPage(){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser();
 const {data:profile}=user?await supabase.from("users").select("org_id").eq("id",user.id).maybeSingle():{data:null};
 const [{data:projects},{data:categories},{data:expenses}]=await Promise.all([
   supabase.from("projects").select("id,project_code,project_name").order("project_name"),
   profile?.org_id?supabase.from("expense_categories").select("id,name,default_classification").eq("org_id",profile.org_id).order("name"):Promise.resolve({data:[]}),
   supabase.from("expenses").select("id,expense_number,expense_date,classification,payee,description,amount,payment_method,paid_from,status,projects(project_name),expense_categories(name),boq_items(boq_number,description)").order("expense_date",{ascending:false}).limit(100)
 ]);
 const total=(expenses??[]).reduce((s:any,e:any)=>s+Number(e.amount??0),0);
 const direct=(expenses??[]).filter((e:any)=>e.classification==="direct_boq").reduce((s:any,e:any)=>s+Number(e.amount??0),0);
 const overhead=total-direct;
 return <div className="min-w-0 space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">Expenses</h1><p className="text-sm text-gray-500">Record direct BOQ costs separately from project overhead.</p></div><Link href="/print/expenses" className="rounded border px-3 py-2 text-sm font-medium">Print expense register / PDF</Link></div>
 <div className="grid gap-3 md:grid-cols-3"><Metric label="Total expenses" value={pkr(total)}/><Metric label="Direct BOQ cost" value={pkr(direct)}/><Metric label="Project overhead" value={pkr(overhead)}/></div>
 <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
  <ExpenseEntryForm projects={(projects??[]) as any} categories={(categories??[]) as any} action={createExpense}/>
  <form action={addCategory} className="min-w-0 rounded-xl border border-border bg-white p-4"><h2 className="mb-3 font-semibold">Expense categories</h2><div className="space-y-3"><input required name="name" placeholder="e.g. Site office, Transport" className="w-full rounded border px-3 py-2 text-sm"/><select required name="default_classification" className="w-full rounded border px-3 py-2 text-sm"><option value="">Default classification</option><option value="direct_boq">Direct BOQ cost</option><option value="overhead">Project overhead</option></select><button className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Add category</button></div><div className="mt-4 space-y-2 text-sm">{(categories??[]).map((c:any)=><div key={c.id} className="flex justify-between border-t pt-2"><span>{c.name}</span><span className="text-xs uppercase text-gray-500">{c.default_classification?.replace("_"," ")}</span></div>)}{!(categories??[]).length&&<p className="text-gray-500">No categories configured yet.</p>}</div></form>
 </div>
 <div className="overflow-x-auto rounded-xl border border-border bg-white"><div className="border-b px-4 py-3 font-semibold">Expense register</div><table className="w-full min-w-[1050px] text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-3 py-2 text-left">Date</th><th className="text-left">Project</th><th className="text-left">Category</th><th className="text-left">Classification</th><th className="text-left">Payee / Description</th><th className="text-left">Payment</th><th className="text-left">Status</th><th className="px-3 text-right">Amount</th></tr></thead><tbody>{(expenses??[]).map((e:any)=><tr key={e.id} className="border-t"><td className="px-3 py-2">{e.expense_date}</td><td>{e.projects?.project_name??"—"}</td><td>{e.expense_categories?.name??"—"}</td><td>{e.classification==="direct_boq"?"Direct BOQ":"Overhead"}</td><td>{e.payee??"—"}<div className="max-w-[360px] truncate text-xs text-gray-500">{e.description??""}</div></td><td>{e.payment_method??"—"}<div className="text-xs text-gray-500">{e.paid_from??""}</div></td><td className="uppercase">{e.status}</td><td className="px-3 text-right font-medium">{pkr(Number(e.amount))}</td></tr>)}{!(expenses??[]).length&&<tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No expenses recorded yet.</td></tr>}</tbody></table></div></div>
}
function Metric({label,value}:{label:string,value:string}){return <div className="min-w-0 rounded-xl border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>}
