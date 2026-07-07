export default interface EventType {
  name: string;
  date: string;
  excerpt?: string;
  description?: string;
  src?: string | StaticImport;
  link?: string;
}
