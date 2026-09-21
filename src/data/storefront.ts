import {products} from './catalogue';

// Public structure is separate from approved commercial records in D1.
export const ranges: {slug:string;name:string;image:string|null;ids:string[]}[] = [
 {slug:'box-trailers',name:'Box trailers',image:'compact-box',ids:['compact-box','ramp-cage-trailer','high-cage-trailer','single-axle-cage']},
 {slug:'single-axle-box-trailers',name:'Single axle trailers',image:'single-cage',ids:['compact-box','single-axle-cage']},
 {slug:'tandem-axle-box-trailers',name:'Tandem axle trailers',image:'high-cage-front',ids:['ramp-cage-trailer','high-cage-trailer']},
 {slug:'car-trailers',name:'Car transporters',image:'car-transporter',ids:['car-transporter']},
 {slug:'enclosed-trailers',name:'Enclosed trailers',image:'enclosed-open',ids:['enclosed-trailer']},
 {slug:'gardening-trailers',name:'Gardening trailers',image:'silver-trades',ids:['gardening-trailer']},
 {slug:'trades-trailers',name:'Trades trailers',image:'black-trades',ids:['trades-trailer']},
 {slug:'cage-trailers',name:'Cage trailers',image:'cage-ramps',ids:['ramp-cage-trailer','high-cage-trailer','single-axle-cage']},
 {slug:'hydraulic-tipper-trailers',name:'Hydraulic tippers',image:null,ids:[]},
 {slug:'flat-top-trailers',name:'Flat top trailers',image:null,ids:[]},
 {slug:'plant-trailers',name:'Plant trailers',image:null,ids:[]},
 {slug:'boat-trailers',name:'Boat trailers',image:null,ids:[]},
 {slug:'jetski-trailers',name:'Jetski trailers',image:null,ids:[]},
 {slug:'cattle-trailers',name:'Cattle trailers',image:null,ids:[]},
 {slug:'atv-trailers',name:'ATV trailers',image:null,ids:[]},
 {slug:'food-trailers',name:'Food trailers',image:null,ids:[]},
 {slug:'horse-floats',name:'Horse floats',image:null,ids:[]},
 {slug:'caravans',name:'Caravans',image:null,ids:[]},
 {slug:'accessories',name:'Parts & accessories',image:null,ids:[]},
];
export const rangeProducts=(slug:string)=>products.filter(p=>ranges.find(r=>r.slug===slug)?.ids.includes(p.id));
export const rangeAliases:Record<string,string>={'box-trailer':'box-trailers','car-trailer':'car-trailers','car-transporters':'car-trailers','box-and-cage':'box-trailers','enclosed':'enclosed-trailers','single-axle-box-trailer':'single-axle-box-trailers','tandem-axle-box-trailer':'tandem-axle-box-trailers','hydraulic-tipper-box-trailer':'hydraulic-tipper-trailers','flat-top-trailer':'flat-top-trailers','plant-trailer':'plant-trailers','boat-trailer':'boat-trailers','jetski-trailer':'jetski-trailers','cattle-trailer':'cattle-trailers'};
export const slides=[
 {eyebrow:'CAR TRAILERS AUSTRALIA',line:'Your next trailer.',accent:'A better way to carry.',text:'Explore car, box, enclosed and equipment trailer designs. Find the layout that works for your load.',image:'headquarters',primary:['Explore all trailers','/shop/'],secondary:['Find your fit','/quote/']},
 {eyebrow:'CAR TRANSPORTERS',line:'A place for your car.',accent:'A plan for the journey.',text:'Start with the vehicle you carry. Explore an open deck, loading access and the configuration you need.',image:'car-transporter',primary:['View car transporters','/product-category/car-trailers/'],secondary:['Compare trailers','/compare/']},
 {eyebrow:'TRADE & GARDENING',line:'Tools in their place.',accent:'Work in your sights.',text:'Plan storage, equipment access and loading around your working day.',image:'silver-trades',primary:['Explore trade trailers','/gardening/'],secondary:['Discuss a fleet','/bulk-orders/']},
 {eyebrow:'BOX & CAGE TRAILERS',line:'Everyday loads.',accent:'More possibilities.',text:'Explore open box and cage layouts for your equipment and everyday carrying requirements.',image:'high-cage-front',primary:['Browse box & cage','/product-category/box-trailers/'],secondary:['Request a quote','/quote/']},
];
export type Promotion={id:string;title:string;detail:string;href:string;endsAt?:string};
export type Location={id:string;name:string;address:string;phone:string;hours:string[];image:string;mapUrl:string};
export type Review={name:string;quote:string;rating:number;sourceUrl:string};
// Populate only with business-approved information. Empty arrays deliberately make no claims.
export const promotions:Promotion[]=[];
export const locations:Location[]=[];
export const reviews:Review[]=[];
export const manuals:{title:string;model:string;url:string}[]=[];
export const finance={applicationUrl:'',calculatorUrl:''};
export const supportLinks=[['Contact us','/contact/'],['Finance','/finance/'],['Trailer maintenance','/maintenance/'],['Warranty','/trailer-warranty/'],['User manuals','/manuals/'],['Collection & delivery','/delivery/'],['FAQs','/faq/'],['Trailer guides','/guides/'],['Bulk orders','/bulk-orders/'],['Dealer enquiries','/dealer/']];
