export interface IGetRandomProductResponse {
  name: string;
  src: string;
}
export async function getRandomProduct(): Promise<IGetRandomProductResponse> {
  console.log(`${process.env.NEXT_PUBLIC_URL}/api/stripe`);
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/stripe`);
  if (!res.ok) throw new Error(JSON.stringify(res.json()));
  const resJson = await res.json();
  console.log(resJson);
  return resJson as IGetRandomProductResponse;
}
