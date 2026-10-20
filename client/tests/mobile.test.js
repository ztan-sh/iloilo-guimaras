import test from 'node:test';
import assert from 'node:assert/strict';
import { accountPerson, bookingIssue, canIssueTicket, canonicalVesselName, clientEvents, departureCountdown, fareFor, normalizeSchedule, paymentState, previewSchedules, remainingFor, rideLabel, sampleClientBookings } from '../src/pages/passenger/mobile/mobileUtils.js';
import { createOperationsStore, DEFAULT_PRICES, samplePhoto } from '../src/components/operations/operationsStore.js';

const person = { id:'customer',name:'Client Student',age:24,gender:'Female',category:'Student' };
const draft = () => ({trip:previewSchedules('2099-01-01',[])[0],people:[person],motorcycle:true,plateNumber:'ABC123',regularFare:false});
test('departure countdown uses the Manila trip date and supports 12-hour API times', () => {
 const now = Date.parse('2026-10-12T09:20:00+08:00');
 assert.deepEqual(departureCountdown({ date:'2026-10-12', departureTime:'09:30' }, now), { minutes:10, value:10, unit:'min' });
 assert.deepEqual(departureCountdown({ date:'2026-10-12', departureTime:'1:00 PM' }, now), { minutes:220, value:3, unit:'hr' });
 assert.equal(departureCountdown({ date:'2026-10-12', departureTime:'09:00' }, now).minutes, 0);
 assert.equal(departureCountdown({ date:'2026-10-13', departureTime:'09:30' }, now).unit, 'day');
 assert.equal(departureCountdown({ departureTime:'09:30' }, now), null);
});
test('legacy schedule vessel names normalize to the supported passenger vessel', () => {
 assert.equal(canonicalVesselName('MV Felipe III'), 'MV Felipe');
 assert.equal(normalizeSchedule({ _id:'legacy', ferryName:'MV Felipe III' }).vesselName, 'MV Felipe');
});
test('mobile checkout requires matching staff approval and keeps configured fees',()=>{
 const store=createOperationsStore();const d=draft();const id=store.requestID(person,samplePhoto,'Client booking');
 assert.match(bookingIssue(d,store.getSnapshot().requests,true),/Staff must approve/);
 store.decide(id,'approved');assert.equal(bookingIssue(d,store.getSnapshot().requests,true),'');
 const q=fareFor(d,store.getSnapshot(),true);assert.deepEqual([q.passengerFare,q.motorcycleFare,q.ppa,q.discount,q.total],[35,285,65,7,383]);
 assert.match(bookingIssue({...d,people:[{...person,name:'Changed name'}]},store.getSnapshot().requests,true),/ID photo/);
 assert.equal(fareFor({...d,regularFare:true},store.getSnapshot(),true).total,390);
 assert.equal(bookingIssue(d,store.getSnapshot().requests,false),'');
 assert.match(bookingIssue({...d,regularFare:true},[],false),/Upload a clear ID photo/);
 assert.equal(fareFor(d,store.getSnapshot(),false).discount,7);
});
test('big bike and standard motorcycles keep the configured fare and passenger limit', () => {
 const store = createOperationsStore();
 for (const motorcycleType of ['standard', 'big-bike']) {
  const d = { ...draft(), motorcycleType, people: [{ ...person, category:'Regular' }], regularFare:true };
  assert.equal(bookingIssue(d, [], false), '');
  assert.equal(fareFor(d, store.getSnapshot(), false).total, motorcycleType === 'big-bike' ? 460 : 390);
  assert.equal(rideLabel(d), motorcycleType === 'big-bike' ? 'Big bike' : 'Motorcycle');
  assert.match(bookingIssue({ ...d, people:Array.from({ length:4 }, (_, i) => ({ ...d.people[0], id:String(i) })) }), /3 with a motorcycle/);
 }
 assert.match(bookingIssue({ ...draft(), motorcycleType:'car', regularFare:true }), /standard motorcycle or big bike/);
});
test('pending payments reserve spaces and failed payments release them',()=>{
 const t=previewSchedules('2099-01-01',[])[0];
 const booking={...sampleClientBookings()[0],date:t.date,passengers:99,vehicleType:'Motorcycle',paymentStatus:'PENDING VERIFICATION'};
 const remaining=remainingFor(t,[booking]);assert.equal(remaining.passengerRemaining,1);assert.equal(remaining.motorcycleRemaining,7);
 const d={...draft(),trip:remaining,people:[person,{...person,id:'companion'}],regularFare:true};
 assert.match(bookingIssue(d,[],true),/not enough passenger/);
 assert.equal(remainingFor(t,[{...booking,paymentStatus:'REJECTED'}]).passengerRemaining,100);
 assert.equal(remainingFor({...t,date:'2026-10-12'},[booking]).passengerRemaining,100);
 assert.equal(remainingFor({...t,vesselName:'Felipe III'},[booking]).passengerRemaining,100);
});
test('only verified and confirmed bookings can issue QR boarding passes',()=>{
 const [paid,pending,failed]=sampleClientBookings();assert.equal(canIssueTicket(paid),true);assert.equal(canIssueTicket(pending),false);assert.equal(canIssueTicket(failed),false);
 assert.equal(canIssueTicket({...paid,status:'CANCELLED'}),false);assert.equal(canIssueTicket({...paid,boardingStatus:'REJECTED'}),false);assert.equal(canIssueTicket(undefined),false);
 assert.deepEqual([paid,pending,failed].map(paymentState),['Paid','Processing','Failed']);
});
test('client updates are restricted to the account and its booking passengers',()=>{
 const bookings=[{_id:'mine',userId:'customer',passengerDetails:[person,{id:'companion'}]},{_id:'theirs',userId:'another',passengerDetails:[{id:'stranger'}]}];
 const requests=[{id:'own-id',passenger:person},{id:'companion-id',passenger:{id:'companion'}},{id:'private-id',passenger:{id:'stranger'}}];
 const events=[{id:'1',bookingId:'mine'},{id:'2',bookingId:'theirs'},{id:'3',requestId:'own-id'},{id:'4',requestId:'companion-id'},{id:'5',requestId:'private-id'},{id:'6',type:'pricing'}];
 assert.deepEqual(clientEvents(bookings,requests,events,'customer').map(e=>e.id),['1','3','4']);
});
test('profile completeness, age eligibility and vessel pricing are enforced',()=>{
 const store=createOperationsStore();const d=draft();assert.match(bookingIssue({...d,people:[{...person,age:''}],regularFare:true}),/name, age and gender/);
 store.savePrices('MV Felipe',{...DEFAULT_PRICES,solo:80,motorcycle:230,companion:160});
 assert.equal(fareFor({...d,trip:{...d.trip,vesselName:'MV Felipe'},regularFare:true},store.getSnapshot(),true).total,380);
 assert.equal(fareFor({...d,regularFare:true},store.getSnapshot(),true).total,390);
 assert.equal(accountPerson({id:'account',fullName:'A'}).age,'');
});
