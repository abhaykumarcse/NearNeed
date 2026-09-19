import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, ChevronRight, CircleUserRound, Compass, Edit3, Mail, MapPin, MessageCircle, Mic, Package, Phone, Plus, Search, ShieldCheck, Sparkles, Star, Trash2, UserRound, Wrench, X, Zap, LogOut, CheckCircle2, Clock3, HandHelping } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { postFindNearby } from '../endpoints/find-nearby_POST.schema';
import { postItem } from '../endpoints/items_POST.schema';
import { getProfileItems } from '../endpoints/profile-items_GET.schema';
import { postItemContact } from '../endpoints/item-contact_POST.schema';
import { getActivity } from '../endpoints/activity_GET.schema';
import { postActivityAction } from '../endpoints/activity-action_POST.schema';
import { postItemManage } from '../endpoints/item-manage_POST.schema';
import { postProfileUpdate } from '../endpoints/profile-update_POST.schema';
import { useAuth } from '../helpers/useAuth';
import { enablePush, onPushEnabledChange, listenToPush } from '../helpers/pushClient';
import { useRealtimeChannel } from '../components/FlootRealtimeProvider';
import styles from './_index.module.css';

const sampleMatches = [
  { id:'item-drill', name:'Rahul · ToolBox', item:'Cordless Drill', distance:'180 m', price:'₹40 / 30 min', rating:'4.9', available:'Available now', icon:Wrench, description:'Cordless drill with basic bits.' },
  { id:'item-bosch', name:'FixPoint Hardware', item:'Bosch Drill + Bits', distance:'320 m', price:'₹80 / hour', rating:'4.8', available:'Available now', icon:Package, description:'Bosch drill set with bits.' },
  { id:'item-tripod', name:'Aman · Creator Kit', item:'Tripod', distance:'460 m', price:'₹60 / day', rating:'5.0', available:'Available now', icon:Sparkles, description:'Phone/camera tripod.' },
];

type ProfileItem = {id:string;name:string;description:string;price:string;priceUnit:string;availableNow:boolean;contactMethod:string;category:string};
type ProfileData = {id:number;email:string;displayName:string;phone:string;avatarUrl:string|null;karma:number;rating:string;createdAt:Date;stats:{helpedCount:number;earned:string;receivedHelpCount:number}};
type ActivityRow = {id:number;itemId:string;itemName:string;itemDescription:string;itemPrice:string;itemPriceUnit:string;otherUserName:string;otherUserEmail?:string;otherUserPhone?:string;message:string;status:string;createdAt:Date;acceptedAt:Date|null;completedAt:Date|null;direction:'received'|'sent'};

export default function Home() {
  const [query,setQuery]=useState('');
  const [submitted,setSubmitted]=useState(false);
  const [loading,setLoading]=useState(false);
  const [resultMessage,setResultMessage]=useState('');
  const [liveResults,setLiveResults]=useState<any[]|null>(null);
  const [locationReady,setLocationReady]=useState(false);
  const [mapsUrl,setMapsUrl]=useState('');
  const [tab,setTab]=useState('Discover');
  const [toolboxOpen,setToolboxOpen]=useState(false);
  const [newItem,setNewItem]=useState('');
  const [description,setDescription]=useState('');
  const [price,setPrice]=useState('');
  const [priceUnit,setPriceUnit]=useState('use');
  const [contactMethod,setContactMethod]=useState<'in_app'|'call'>('in_app');
  const [profileItems,setProfileItems]=useState<ProfileItem[]>([]);
  const [profile,setProfile]=useState<ProfileData|null>(null);
  const [activity,setActivity]=useState<{received:ActivityRow[];sent:ActivityRow[];stats:ProfileData['stats']}>({received:[],sent:[],stats:{helpedCount:0,earned:'0',receivedHelpCount:0}});
  const [selected,setSelected]=useState<any>(null);
  const [contactMessage,setContactMessage]=useState('I need this item. Is it available now?');
  const [contactSent,setContactSent]=useState(false);
  const [itemMessage,setItemMessage]=useState('');
  const [activityMessage,setActivityMessage]=useState('');
  const [editing,setEditing]=useState(false);
  const [editName,setEditName]=useState('');
  const [editDescription,setEditDescription]=useState('');
  const [editPrice,setEditPrice]=useState('');
  const [editPriceUnit,setEditPriceUnit]=useState('use');
  const [editContactMethod,setEditContactMethod]=useState<'in_app'|'call'>('in_app');
  const [editAvailable,setEditAvailable]=useState(true);
  const [profileEditing,setProfileEditing]=useState(false);
  const [profileName,setProfileName]=useState('');
  const [profilePhone,setProfilePhone]=useState('');
  const [pushEnabled,setPushEnabled]=useState(false);
  const [inAppNotice,setInAppNotice]=useState('');
  const { authState, logout, onLogin } = useAuth();
  const matches = useMemo(()=>sampleMatches,[]);

  const loadProfile=async()=>{
    if(authState.type!=='authenticated') return;
    try{
      const r=await getProfileItems();
      setProfileItems(r.items); setProfile(r.profile);
      setProfileName(r.profile.displayName); setProfilePhone(r.profile.phone||'');
    }catch{ setProfileItems([]); }
  };
  const loadActivity=async()=>{
    if(authState.type!=='authenticated') return;
    try{ setActivity(await getActivity()); }catch{ setActivity({received:[],sent:[],stats:{helpedCount:0,earned:'0',receivedHelpCount:0}}); }
  };
  useEffect(()=>{ if(authState.type==='authenticated'){loadProfile();loadActivity();} else {setProfile(null);setProfileItems([]);}},[authState.type]);
  useEffect(()=>onPushEnabledChange(setPushEnabled),[]);
  useEffect(()=>listenToPush(),[]);
  useEffect(()=>{
    const handler=(event:Event)=>{
      const payload=(event as CustomEvent).detail;
      setInAppNotice(payload?.title ? `${payload.title}: ${payload.body||''}` : 'New NearNeed notification');
      loadActivity();
      window.setTimeout(()=>setInAppNotice(''),6000);
    };
    window.addEventListener('nearneed:push',handler);
    return ()=>window.removeEventListener('nearneed:push',handler);
  },[authState.type]);
  useRealtimeChannel(authState.type==='authenticated'?'user:'+authState.user.id:null,(msg)=>{
    if(msg?.type==='notification'){
      setInAppNotice(msg.title ? `${msg.title}: ${msg.body||''}` : 'New NearNeed notification');
      loadActivity();
      window.setTimeout(()=>setInAppNotice(''),6000);
    }
  });

  const getLocation=()=>new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,maximumAge:300000,timeout:8000}));

  const submitNeed=async()=>{
    if(!query.trim()) return;
    setSubmitted(true);setLoading(true);setResultMessage('');
    try{
      const position=await getLocation(); setLocationReady(true);
      setMapsUrl(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@${position.coords.latitude},${position.coords.longitude},16z`);
      const data=await postFindNearby({query,latitude:position.coords.latitude,longitude:position.coords.longitude,radiusM:500});
      setResultMessage(data.message);
      setLiveResults(data.results.map(r=>({...r,name:r.name,item:r.item,distance:`${r.distanceM} m`,rating:r.rating.toFixed(1),icon:r.type==='shop'?Package:Wrench})));
    }catch{setResultMessage('Location/search unavailable right now. Please allow location and try again.');setLiveResults([]);}
    finally{setLoading(false);}
  };

  const openItem=(item:any)=>{
    setSelected(item);setContactSent(false);setContactMessage('I need this item. Is it available now?');setEditing(false);
    if(item.owner===(authState.type==='authenticated'?authState.user.displayName:'')){
      setEditName(item.name||item.item||'');setEditDescription(item.description||'');setEditPrice(String(item.rawPrice??item.price?.match?.(/\d+/)?.[0]??0));
      setEditPriceUnit(item.priceUnit||'use');setEditContactMethod(item.contactMethod||'in_app');setEditAvailable(item.availableNow!==false);
    }
  };

  const saveItem=async()=>{
    if(!selected?.id) return;
    try{
      await postItemManage({action:'update',itemId:selected.id,name:editName,description:editDescription,price:Number(editPrice||0),priceUnit:editPriceUnit,contactMethod:editContactMethod,availableNow:editAvailable});
      setItemMessage('Item updated successfully.');setEditing(false);await loadProfile();setSelected(null);
    }catch(e){setItemMessage(e instanceof Error?e.message:'Unable to update item.');}
  };
  const deleteItem=async()=>{
    if(!selected?.id||!window.confirm('Delete this item from your toolbox?')) return;
    try{await postItemManage({action:'delete',itemId:selected.id});setSelected(null);setItemMessage('Item deleted.');await loadProfile();}catch(e){setItemMessage(e instanceof Error?e.message:'Unable to delete item.');}
  };
  const sendContact=async()=>{
    if(!selected?.id) return;
    try{await postItemContact({itemId:selected.id,message:contactMessage});setContactSent(true);await loadActivity();}catch(e){setItemMessage(e instanceof Error?e.message:'Please log in first.');}
  };
  const actionRequest=async(requestId:number,action:'accept'|'decline'|'complete')=>{
    try{setActivityMessage('Updating…');await postActivityAction({requestId,action});await Promise.all([loadActivity(),loadProfile()]);setActivityMessage(action==='accept'?'Request accepted — contact details are now visible.':action==='decline'?'Request declined.':'Help marked completed.');}
    catch(e){setActivityMessage(e instanceof Error?e.message:'Unable to update request.');}
  };
  const saveProfile=async()=>{
    try{
      const r=await postProfileUpdate({displayName:profileName,phone:profilePhone});
      if(authState.type==='authenticated') onLogin({...authState.user,displayName:r.user.displayName});
      setProfileEditing(false);await loadProfile();
    }catch(e){setActivityMessage(e instanceof Error?e.message:'Unable to update profile.');}
  };

  const renderDiscover=()=>(
    <>
      <section className={styles.hero}><div className={styles.eyebrow}><span>HYPER-LOCAL</span><b>500m LIVE RADAR</b></div><h1>What do you need<br/><em>right now?</em></h1><p>Find someone nearby who can solve it.</p><div className={styles.searchBox}><Search size={20}/><Input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitNeed()} placeholder="e.g. Need a drill for 30 minutes" aria-label="What do you need"/><button className={styles.mic} aria-label="Voice search"><Mic size={19}/></button><Button onClick={submitNeed} className={styles.findBtn}>Find <ChevronRight size={17}/></Button></div><button className={styles.location} onClick={()=>navigator.geolocation?.getCurrentPosition(()=>setLocationReady(true),()=>setLocationReady(false),{enableHighAccuracy:false,timeout:5000,maximumAge:300000})}><MapPin size={14}/> {locationReady?'Location enabled':'Enable location'} <span>·</span> 500m radius <ChevronRight size={13}/></button></section>
      <section className={styles.radarWrap}><div className={styles.radarTop}><div><span className={styles.sectionKicker}>LIVE RADAR</span><h2>Solutions near you</h2></div><span className={styles.count}>{(liveResults??matches).length} nearby</span></div><div className={styles.radar}>{[1,2,3].map(n=><motion.div key={n} className={styles.ring} animate={{scale:[1,1.04,1],opacity:[.42,.18,.42]}} transition={{duration:2.6,repeat:Infinity,delay:n*.35}} style={{width:`${n*25}%`,height:`${n*25}%`}}/>)}<div className={styles.scan}/><div className={styles.you}><span>YOU</span><div><MapPin size={17}/></div></div>{['a','b','c','d','e'].map((p,i)=><motion.div key={p} className={`${styles.node} ${styles[`n${i}`]}`} animate={{y:[0,-5,0]}} transition={{duration:2+i*.2,repeat:Infinity}}><span>{i<2?'✓':'+'}</span></motion.div>)}<div className={styles.radarLabel}>500 M<br/><small>SEARCH RADIUS</small></div></div></section>
      {submitted&&<motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className={styles.parsed}><Sparkles size={16}/><div><strong>{loading?'Finding nearby…':'Search complete'}</strong><span>{loading?`Checking 500m around your location for “${query}”`:resultMessage}</span></div><span className={styles.searching}>{loading?'FAST SCAN…':'DONE'}</span></motion.section>}
      <section className={styles.matches}><div className={styles.rowTitle}><h2>{submitted?'Nearby matches':'Popular nearby'}</h2><span className={styles.tapHint}>Tap a result for details</span></div>{(liveResults??matches).map((match:any,i:number)=>{const Icon=match.icon;return <motion.article key={(match.id||match.name)+match.item} className={styles.card} role="button" tabIndex={0} onClick={()=>openItem(match)} onKeyDown={e=>e.key==='Enter'&&openItem(match)} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}><div className={styles.cardIcon}><Icon size={20}/></div><div className={styles.cardBody}><div className={styles.cardLine}><strong>{match.item}</strong><span className={styles.distance}>{match.distance}</span></div><div className={styles.provider}>{match.name}</div><div className={styles.meta}><span className={styles.available}><i/> {match.available}</span><span><Star size={12} fill="currentColor"/> {match.rating}</span><span>{match.price}</span></div></div><ChevronRight size={18} className={styles.arrow}/></motion.article>})}{submitted&&!loading&&liveResults?.length===0&&mapsUrl&&<a className={styles.mapsFallback} href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={17}/><div><strong>Search nearby places</strong><span>Public-place result only — stock is not confirmed</span></div><ChevronRight size={18}/></a>}</section>
    </>
  );

  const renderToolbox=()=>(
    <section className={styles.tabPage}><div className={styles.pageIntro}><span className={styles.sectionKicker}>YOUR NETWORK</span><h1>Virtual Toolbox</h1><p>List what you have. Nearby people can discover it and send a request.</p><Button onClick={()=>setToolboxOpen(!toolboxOpen)} className={styles.addBtn}><Plus size={17}/> {toolboxOpen?'Close':'Add item'}</Button></div>
      {toolboxOpen&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={styles.addItemForm}><Input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Item name e.g. Drill Machine"/><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Details: condition, bits, usage…"/><div className={styles.formGrid}><Input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price (0 = Free)" type="number"/><select value={priceUnit} onChange={e=>setPriceUnit(e.target.value)}><option value="use">per use</option><option value="hour">per hour</option><option value="day">per day</option><option value="30 min">per 30 min</option></select><select value={contactMethod} onChange={e=>setContactMethod(e.target.value as 'in_app'|'call')}><option value="in_app">Contact: In-app</option><option value="call">Contact: Call after request</option></select></div><Button onClick={async()=>{setItemMessage('');try{const p=await getLocation();if(authState.type!=='authenticated')throw new Error('Log in first.');await postItem({name:newItem,description,price:Number(price||0),priceUnit,contactMethod,latitude:p.coords.latitude,longitude:p.coords.longitude,category:'other'});setItemMessage('Added to your profile and nearby network.');setNewItem('');setDescription('');setPrice('');await loadProfile();setToolboxOpen(false);}catch(e){setItemMessage(e instanceof Error?e.message:'Log in and allow location first.');}}}>Add to network</Button></motion.div>}
      {itemMessage&&<p className={styles.itemMessage}>{itemMessage}</p>}<div className={styles.toolboxHeader}><h2>My items</h2><span>{profileItems.filter(i=>i.availableNow).length} available now</span></div>
      {profileItems.length?profileItems.map(i=><button key={i.id} className={styles.profileItem} onClick={()=>openItem({...i,item:i.name,name:authState.type==='authenticated'?authState.user.displayName:'You',owner:authState.type==='authenticated'?authState.user.displayName:'You',price:Number(i.price)>0?`₹${i.price} / ${i.priceUnit}`:'Free',rawPrice:i.price})}><div className={styles.cardIcon}><Package size={19}/></div><div><strong>{i.name}</strong><span>{i.description||'No extra details added'}</span><small>{i.availableNow?'Available now':'Paused'} · {i.contactMethod==='call'?'Call after accept':'In-app contact'}</small></div><b>{Number(i.price)>0?`₹${i.price}`:'FREE'}</b></button>):<div className={styles.emptyState}><Package size={24}/><strong>Your toolbox is empty</strong><span>Add your first item and it will appear in your profile and nearby matching.</span></div>}</section>
  );

  const activityCard=(r:ActivityRow)=>(
    <motion.article key={r.id} className={styles.activityCard} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className={styles.activityIcon}><HandHelping size={18}/></div><div className={styles.activityMain}><div className={styles.activityTop}><strong>{r.itemName}</strong><span className={`${styles.status} ${styles['s_'+r.status]||''}`}>{r.status}</span></div><span className={styles.activityPerson}>{r.direction==='received'?'From':'To'} {r.otherUserName} · {r.itemPrice==='0'?'Free':`₹${r.itemPrice} / ${r.itemPriceUnit}`}</span><p>“{r.message||'No comment added.'}”</p>{(r.status==='accepted'||r.status==='completed')&&<div className={styles.contactReveal}><strong>Contact unlocked</strong><span>{r.otherUserEmail&&<><Mail size={13}/> {r.otherUserEmail}</>}{r.otherUserPhone&&<><Phone size={13}/> {r.otherUserPhone}</>}{!r.otherUserEmail&&!r.otherUserPhone&&'No phone added yet; use the in-app contact.'}</span></div>}{r.direction==='received'&&r.status==='pending'&&<div className={styles.actionRow}><Button onClick={()=>actionRequest(r.id,'accept')}><Check size={15}/> Accept</Button><button onClick={()=>actionRequest(r.id,'decline')} className={styles.secondaryAction}>Decline</button></div>}{r.status==='accepted'&&<Button onClick={()=>actionRequest(r.id,'complete')} className={styles.completeBtn}><CheckCircle2 size={15}/> Mark help completed</Button>}</div></motion.article>
  );

  const renderActivity=()=>(
    <section className={styles.tabPage}><div className={styles.pageIntro}><span className={styles.sectionKicker}>LIVE ACTIVITY</span><h1>Requests & help</h1><p>Incoming requests appear here. Accepting one unlocks the contact details for both people.</p></div>{activityMessage&&<div className={styles.notice}>{activityMessage}</div>}<div className={styles.activitySection}><div className={styles.sectionTitle}><h2>Requests for my items</h2><span>{activity.received.length}</span></div>{activity.received.length?activity.received.map(activityCard):<div className={styles.emptyState}><Bell size={23}/><strong>No incoming requests</strong><span>When someone requests your item, it will appear here.</span></div>}</div><div className={styles.activitySection}><div className={styles.sectionTitle}><h2>My requests</h2><span>{activity.sent.length}</span></div>{activity.sent.length?activity.sent.map(activityCard):<div className={styles.emptyState}><Clock3 size={23}/><strong>No requests sent</strong><span>Search for an item and send a short comment with your request.</span></div>}</div></section>
  );

  const renderProfile=()=>(
    <section className={styles.tabPage}><div className={styles.profileHero}><div className={styles.avatar}><UserRound size={30}/></div><div><span className={styles.sectionKicker}>YOUR PROFILE</span><h1>{profile?.displayName||'Profile'}</h1><p>{profile?.email||''}</p></div></div>
      <div className={styles.statsGrid}><div><HandHelping/><b>{profile?.stats.helpedCount??0}</b><span>People helped</span><small>All time</small></div><div><span className={styles.rupee}>₹</span><b>₹{profile?.stats.earned??'0'}</b><span>Earned from paid help</span><small>All time</small></div><div><MessageCircle/><b>{profile?.stats.receivedHelpCount??0}</b><span>Help received</span><small>All time</small></div><div><Star/><b>{profile?.rating??'5.0'}</b><span>Rating</span><small>{profile?.karma??0} Karma</small></div></div>
      <div className={styles.profileBlock}><div className={styles.sectionTitle}><div><span className={styles.sectionKicker}>ACCOUNT</span><h2>Login & contact</h2></div>{!profileEditing&&<button className={styles.iconTextButton} onClick={()=>setProfileEditing(true)}><Edit3 size={14}/> Edit</button>}</div>{profileEditing?<div className={styles.profileEdit}><Input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Display name"/><Input value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} placeholder="Phone number (shown only after request acceptance)" type="tel"/><div className={styles.actionRow}><Button onClick={saveProfile}>Save profile</Button><button className={styles.secondaryAction} onClick={()=>setProfileEditing(false)}>Cancel</button></div></div>:<div className={styles.accountRows}><span><UserRound size={15}/> {profile?.displayName}</span><span><Mail size={15}/> {profile?.email}</span><span><Phone size={15}/> {profile?.phone||'Add a phone number so accepted matches can contact you'}</span></div>}<div className={styles.loginMethods}><ShieldCheck size={16}/><span>Google account login is available on the login screen. Password login remains available too. Your phone/email are only revealed after a request is accepted.</span></div><div className={styles.notificationSetting}><div><strong>Notifications</strong><span>{pushEnabled?'Push notifications are enabled on this device.':'Enable notifications to receive new requests on your phone and inside NearNeed.'}</span></div><Button onClick={()=>void enablePush()} className={styles.notifyBtn}><Bell size={15}/> {pushEnabled?'Notifications on':'Enable notifications'}</Button></div><Button onClick={async()=>{await logout();setTab('Discover')}} className={styles.logoutBtn}><LogOut size={15}/> Log out</Button></div>
      <div className={styles.profileBlock}><div className={styles.sectionTitle}><div><span className={styles.sectionKicker}>YOUR TOOLBOX</span><h2>Available items</h2></div><span>{profileItems.length} total</span></div>{profileItems.length?profileItems.map(i=><button key={i.id} className={styles.profileItem} onClick={()=>openItem({...i,item:i.name,name:profile?.displayName||'You',owner:profile?.displayName||'You',price:Number(i.price)>0?`₹${i.price} / ${i.priceUnit}`:'Free',rawPrice:i.price})}><div className={styles.cardIcon}><Package size={19}/></div><div><strong>{i.name}</strong><span>{i.description||'No extra details added'}</span><small>{i.availableNow?'Available now':'Not available now'} · {Number(i.price)>0?`₹${i.price} / ${i.priceUnit}`:'Free'}</small></div><b>Details <ChevronRight size={14}/></b></button>):<div className={styles.emptyState}><Package size={23}/><strong>No items yet</strong><span>Open Toolbox and add something you can share nearby.</span></div>}</div>
    </section>
  );

  return <main className={styles.app}><div className={styles.glow}/><header className={styles.header}><div className={styles.brand}><span className={styles.logo}><Zap size={17}/></span><span>NearNeed</span></div><div className={styles.headerActions}><span className={styles.live}><i/> LIVE</span><button aria-label="Notifications" onClick={()=>setTab('Activity')}><Bell size={19}/></button>{authState.type==='authenticated'?<button className={styles.loginLink} onClick={()=>setTab('Profile')}>{authState.user.displayName}</button>:<a className={styles.loginLink} href="/login">Log in</a>}</div></header>
    {inAppNotice&&<motion.button initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className={styles.pushToast} onClick={()=>setTab('Activity')}><Bell size={16}/><span>{inAppNotice}</span><ChevronRight size={15}/></motion.button>}
    {tab==='Discover'&&renderDiscover()}
    {tab==='Toolbox'&&(authState.type==='authenticated'?renderToolbox():<section className={styles.tabPage}><div className={styles.emptyState}><ShieldCheck size={28}/><strong>Log in to use your Toolbox</strong><span>Create your account or continue with Google to list items and receive requests.</span><a className={styles.loginCta} href="/login">Log in / Create account</a></div></section>)}
    {tab==='Activity'&&(authState.type==='authenticated'?renderActivity():<section className={styles.tabPage}><div className={styles.emptyState}><Bell size={28}/><strong>Log in to see activity</strong><a className={styles.loginCta} href="/login">Log in / Create account</a></div></section>)}
    {tab==='Profile'&&(authState.type==='authenticated'?renderProfile():<section className={styles.tabPage}><div className={styles.emptyState}><CircleUserRound size={28}/><strong>Your profile starts here</strong><span>Use email/password or choose your Google account.</span><a className={styles.loginCta} href="/login">Log in / Create account</a></div></section>)}
    <nav className={styles.nav}>{[['Discover',Compass],['Toolbox',Package]].map(([name,Icon]:any)=><button key={name} onClick={()=>setTab(name)} className={tab===name?styles.active:''}><Icon size={20}/><span>{name}</span></button>)}<button className={styles.post} onClick={()=>{setTab('Discover');setTimeout(()=>document.querySelector<HTMLInputElement>('input[aria-label="What do you need"]')?.focus(),0)}} aria-label="Post a need"><Plus size={24}/></button>{[['Activity',Zap],['Profile',CircleUserRound]].map(([name,Icon]:any)=><button key={name} onClick={()=>setTab(name)} className={tab===name?styles.active:''}><Icon size={20}/><span>{name}</span></button>)}</nav>
    {selected&&<div className={styles.modalBack} onClick={()=>setSelected(null)}><motion.div className={styles.detailModal} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} onClick={e=>e.stopPropagation()}><button className={styles.close} onClick={()=>setSelected(null)}><X size={19}/></button><div className={styles.detailIcon}><Package size={28}/></div>{editing?<><span className={styles.sectionKicker}>EDIT TOOLBOX ITEM</span><h2>Edit item</h2><div className={styles.editForm}><Input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Item name"/><Textarea value={editDescription} onChange={e=>setEditDescription(e.target.value)} placeholder="Details"/><div className={styles.formGrid}><Input value={editPrice} onChange={e=>setEditPrice(e.target.value)} type="number" placeholder="Price"/><select value={editPriceUnit} onChange={e=>setEditPriceUnit(e.target.value)}><option value="use">per use</option><option value="hour">per hour</option><option value="day">per day</option><option value="30 min">per 30 min</option></select><select value={editContactMethod} onChange={e=>setEditContactMethod(e.target.value as 'in_app'|'call')}><option value="in_app">In-app contact</option><option value="call">Call after accept</option></select></div><label className={styles.checkRow}><input type="checkbox" checked={editAvailable} onChange={e=>setEditAvailable(e.target.checked)}/> Available now</label><div className={styles.actionRow}><Button onClick={saveItem}>Save changes</Button><button className={styles.secondaryAction} onClick={()=>setEditing(false)}>Cancel</button></div></div></>:<><span className={styles.sectionKicker}>{selected.owner===(authState.type==='authenticated'?authState.user.displayName:'')?'MY TOOLBOX ITEM':'NEARBY PROVIDER'}</span><h2>{selected.item||selected.name}</h2><p className={styles.detailProvider}>{selected.owner||selected.name} {selected.distance&&` · ${selected.distance}`}</p><div className={styles.detailPrice}>{selected.price||'Free'}</div><p>{selected.description||'Provider has not added extra details.'}</p><div className={styles.detailRows}><span><CheckCircle2 size={16}/> {selected.available|| (selected.availableNow?'Available now':'Currently unavailable')}</span>{selected.rating&&<span><Star size={16}/> {selected.rating} rating</span>}{selected.distance&&<span><MapPin size={16}/> {selected.distance}</span>}</div>{selected.owner===(authState.type==='authenticated'?authState.user.displayName:'')&&selected.id?<div className={styles.actionRow}><Button onClick={()=>setEditing(true)}><Edit3 size={15}/> Edit</Button><button className={styles.dangerAction} onClick={deleteItem}><Trash2 size={15}/> Delete</button></div>:selected.id&&<>{authState.type==='authenticated'?<><Textarea value={contactMessage} onChange={e=>setContactMessage(e.target.value)} className={styles.contactBox} placeholder="Optional comment with your request…"/><Button onClick={sendContact}><MessageCircle size={17}/> {contactSent?'Request sent':'Send request'}</Button><p className={styles.contactHint}><ShieldCheck size={13}/> Your phone/email stay hidden until the provider accepts.</p></>:<a className={styles.loginCta} href="/login">Log in to send request</a>}</>}</>}</motion.div></div>}
  </main>;
}