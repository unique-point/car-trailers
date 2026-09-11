export type Product = {
 id: string; slug: string; name: string; category: string; description: string;
 images: string[]; pictured: string[]; mode: 'quote' | 'purchase';
 priceCents: number | null; specifications: Record<string,string>; options: Option[];
 stock: number | null; leadTime: string | null; revision: number;
};
export type Option = { id:string; name:string; priceCents:number; excludes:string[] };
export const categories = [
 {slug:'car-transporters',name:'Car transporters',image:'car-transporter'},
 {slug:'box-and-cage',name:'Box & cage trailers',image:'high-cage-front'},
 {slug:'enclosed',name:'Enclosed trailers',image:'enclosed-open'},
 {slug:'trade-and-gardening',name:'Trade & gardening',image:'silver-trades'}
];
const design = (id:string,name:string,category:string,description:string,images:string[],pictured:string[]):Product => ({id,slug:id,name,category,description,images,pictured,mode:'quote',priceCents:null,specifications:{},options:[],stock:null,leadTime:null,revision:1});
export const products:Product[] = [
 design('car-transporter','Car transporter','car-transporters','A low, open deck with loading ramps. Start with the vehicle you want to carry and we’ll help you explore a suitable configuration.',['car-transporter'],['Open deck','Twin loading ramps','Tandem axle layout']),
 design('compact-box','Compact box trailer','box-and-cage','A simple open box layout for everyday loads. Tell us what you carry, where you tow and how you plan to load it.',['compact-box'],['Open box','Single axle layout']),
 design('enclosed-trailer','Enclosed trailer','enclosed','Explore enclosed storage with rear and side access. Choose the access arrangement that suits your equipment and working day.',['enclosed-open','enclosed-closed','enclosed-side'],['Enclosed body','Side access concepts','Rear access concepts']),
 design('gardening-trailer','Gardening & equipment trailer','trade-and-gardening','Plan a place for the mower, long tools and the equipment you reach for every day. Explore a trailer layout around your own equipment list.',['silver-trades'],['Equipment compartment','Loading ramp','Tandem axle layout']),
 design('trades-trailer','Trades trailer','trade-and-gardening','Explore tool storage alongside an open load area. Tell us about your tools, materials and access requirements.',['black-trades','black-front-locker'],['Front storage','Open load area','Tandem axle layout']),
 design('ramp-cage-trailer','Ramp & cage trailer','box-and-cage','An open cage layout with ramp access shown. Discuss your load, preferred loading method and storage needs.',['cage-ramps','cage-closed'],['Mesh cage','Ramp access concept','Tandem axle layout']),
 design('high-cage-trailer','High cage trailer','box-and-cage','Explore a taller cage format for bulky loads. Start your enquiry with the load dimensions and weight you need to accommodate.',['high-cage-front','high-cage-rear'],['Tall mesh cage','Open top','Tandem axle layout']),
 design('single-axle-cage','Single axle cage trailer','box-and-cage','A compact cage format with open access. Share your intended loads and towing vehicle to begin your enquiry.',['single-cage'],['Low mesh cage','Single axle layout'])
];
export const findProduct = (id:string) => products.find(p=>p.id===id);
export const money = (cents:number) => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(cents/100);
