import { DEFAULT_PRICES, discountCategory, passengerIdentity, personIssue, quoteRide } from '../../../components/operations/operationsStore.js';
import { matchesTrip, todayInManila } from '../../Staff/staffUtils.js';

export { todayInManila };
export const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
export const discountAmountFor = booking => {
    const saved = Number(booking?.discountAmount) || 0;
    if (saved > 0) return Math.round(saved * 100) / 100;
    const gross = (Number(booking?.passengerFare) || 0)
        + (Number(booking?.motorcycleFare) || 0)
        + (Number(booking?.stampFee) || 0)
        + (Number(booking?.ppaFee) || 0);
    const total = Number(booking?.requiredAmount);
    return Number.isFinite(total) ? Math.max(0, Math.round((gross - total) * 100) / 100) : 0;
};
export const paymentState = booking => booking.paymentStatus === 'VERIFIED' ? 'Paid' : ['REJECTED', 'FAILED'].includes(booking.paymentStatus) ? 'Failed' : 'Processing';
export const canIssueTicket = booking => Boolean(booking?.bookingReference && booking.paymentStatus === 'VERIFIED' && booking.status === 'CONFIRMED' && booking.boardingStatus !== 'REJECTED');
export const accountPerson = user => ({ id: user.id || user._id, name: user.fullName || '', age: user.age ?? '', gender: user.gender || '', category: user.category || 'Regular', savedProfile: true });
export const requestFor = (requests, person) => requests.findLast(r => r.identity === passengerIdentity(person));
export const rideLabel = draft => draft.motorcycle ? draft.motorcycleType === 'big-bike' ? 'Big bike' : 'Motorcycle' : draft.people.length > 1 ? 'Companion' : 'Solo';
export function departureCountdown(trip, now = Date.now()) {
    const match = String(trip.departureTime || '').match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match || !trip.date) return null;
    let hour = Number(match[1]);
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    const departure = Date.parse(`${String(trip.date).slice(0, 10)}T${String(hour).padStart(2, '0')}:${match[2]}:00+08:00`);
    if (!Number.isFinite(departure)) return null;
    const minutes = Math.max(0, Math.ceil((departure - now) / 60000));
    return { minutes, value: minutes < 60 ? minutes : minutes < 1440 ? Math.floor(minutes / 60) : Math.floor(minutes / 1440), unit: minutes < 60 ? 'min' : minutes < 1440 ? 'hr' : 'day' };
}
export function bookingWindowIssue(trip, motorcycle = false, now = Date.now()) {
    const match = String(trip?.departureTime || '').match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match || !trip?.date) return 'Choose a valid departure time.';
    let hour = Number(match[1]);
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    const departure = Date.parse(`${String(trip.date).slice(0, 10)}T${String(hour).padStart(2, '0')}:${match[2]}:00+08:00`);
    if (!Number.isFinite(departure)) return 'Choose a valid departure time.';
    const cutoff = (motorcycle ? 24 : 3) * 60 * 60 * 1000;
    if (departure <= now) return 'This departure has already left. Choose a future trip.';
    if (departure - now < cutoff) return motorcycle
        ? 'Motorcycle bookings must be made at least 1 day before departure (Philippine time).'
        : 'Passenger bookings must be made at least 3 hours before departure (Philippine time).';
    return '';
}
export const fareFor = (draft, operations, preview, livePrices = null) => quoteRide(preview ? operations.prices[draft.trip.vesselName] || DEFAULT_PRICES : livePrices || DEFAULT_PRICES, draft.people, draft.motorcycle, operations.requests || [], draft.regularFare, draft.motorcycleType);
export function bookingIssue(draft, requests = [], preview = false) {
    if (!draft?.trip) return 'Choose a departure first.';
    const windowIssue = bookingWindowIssue(draft.trip, draft.motorcycle);
    if (windowIssue) return windowIssue;
    if (!draft.people.length || draft.people.length > (draft.motorcycle ? 3 : 10)) return 'Choose up to 10 passengers, or 3 with a motorcycle.';
    const personError = draft.people.map(personIssue).find(Boolean); if (personError) return personError;
    if (draft.motorcycle && !draft.plateNumber?.trim()) return 'Enter your motorcycle plate number.';
    if (draft.motorcycle && draft.motorcycleType && !['standard', 'big-bike'].includes(draft.motorcycleType)) return 'Choose a standard motorcycle or big bike.';
    if (draft.trip.bookingClosed || draft.trip.manualClosed) return 'This departure is closed. Choose another trip.';
    if (draft.people.length > draft.trip.passengerRemaining) return 'There are not enough passenger spaces on this departure.';
    if (draft.motorcycle && draft.trip.motorcycleRemaining < 1) return 'Online motorcycle spaces are full. Choose another departure or travel without a motorcycle.';
    const eligible = draft.people.filter(p => discountCategory(p) !== 'Regular');
    if (eligible.some(p => !requestFor(requests, p)?.photo)) return 'Upload a clear ID photo for every Student, PWD or senior passenger before continuing.';
    if (preview && !draft.regularFare && eligible.some(p => requestFor(requests, p)?.status !== 'approved')) return 'Staff must approve every requested passenger ID before discounted payment.';
    return '';
}
export function photoIssue(file) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPG, PNG or WebP photo.';
    return file.size > 5 * 1024 * 1024 ? 'Choose a photo smaller than 5 MB.' : '';
}
export async function compressIdPhoto(file) {
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Unable to prepare this ID photo. Please choose another image.');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to compress this ID photo.')), 'image/jpeg', 0.82));
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
            reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read the prepared ID photo.'));
            reader.onerror = () => reject(new Error('Unable to read the prepared ID photo.'));
            reader.readAsDataURL(blob);
        });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
export const passwordIssue = password => password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password) ? 'Use at least 8 characters with uppercase, lowercase, a number and a special character.' : '';
export const canonicalVesselName = value => /^MV\s+Felipe\s+III$/i.test(String(value || '').trim()) ? 'MV Felipe' : String(value || '').trim();
export const normalizeSchedule = schedule => ({ ...schedule, id: schedule.id || schedule._id || schedule.ferryId, vesselName: canonicalVesselName(schedule.vesselName || schedule.ferryName), route: schedule.route || `${schedule.origin} → ${schedule.destination}`, departureTime: schedule.departureTime || schedule.time, passengerRemaining: Number(schedule.passengerRemaining ?? Math.max(0, schedule.passengerCapacity - (schedule.passengers || 0))), motorcycleRemaining: Number(schedule.motorcycleRemaining ?? schedule.vehicleRemaining ?? 0) });
export function remainingFor(trip, bookings) {
    const reservations = bookings.filter(b => matchesTrip(b, trip) && paymentState(b) !== 'Failed' && b.boardingStatus !== 'REJECTED');
    const passengers = reservations.reduce((sum, b) => sum + Number(b.passengers || 1), 0);
    const motorcycles = reservations.filter(b => b.vehicleType === 'Motorcycle').length;
    return { ...trip, passengerRemaining: Math.max(0, trip.passengerCapacity - passengers), motorcycleRemaining: Math.max(0, trip.motorcycleCapacity - trip.walkInMotorcycleCapacity - motorcycles), bookingClosed: passengers >= trip.passengerCapacity };
}
export function clientEvents(bookings, requests, events, userId) {
    const mine = bookings.filter(b => b.userId === userId);
    const ownRequests = requests.filter(r => r.passenger.id === userId || mine.some(b => b.passengerDetails?.some(p => p.id === r.passenger.id)));
    const ids = new Set(ownRequests.map(r => r.id));
    const bookingIds = new Set(mine.map(b => b._id));
    return events.filter(e => ids.has(e.requestId) || bookingIds.has(e.bookingId));
}
export function previewSchedules(date, bookings) {
    return ['MV Halili', 'MV FastCraft', 'MV Felipe'].flatMap((vesselName, v) => ['Iloilo → Guimaras', 'Guimaras → Iloilo'].flatMap((route, r) => ['09:30', '10:15', '13:00', '15:30'].map((departureTime, i) => {
        const [h, m] = departureTime.split(':').map(Number); const arrival = h * 60 + m + 30;
        return remainingFor({ id: v === 0 && i === 0 && r === 0 ? 'preview-iloilo' : v === 0 && i === 1 && r === 1 ? 'preview-guimaras' : `client-trip-${v}-${r}-${i}`, vesselName, date, route, departureTime, arrivalTime: `${String(Math.floor(arrival / 60)).padStart(2, '0')}:${String(arrival % 60).padStart(2, '0')}`, passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 2 }, bookings);
    })));
}
export function sampleClientBookings(userId = 'sample-sarah') {
    const date = todayInManila();
    const base = { userId, date, origin: 'Iloilo', destination: 'Guimaras', time: '09:30', arrivalTime: '10:00', vesselName: 'MV Halili', ferryName: 'MV Halili', passengers: 1, passengerName: 'Sarah Fukiko', passengerAge: 24, passengerGender: 'Female', vehicleType: 'No Motorcycle', ticketSource: 'ONLINE', boardingStatus: 'NOT BOARDED', requiredAmount: 105, totalPaid: null, paymentMethod: 'GCash', passengerDetails: [{ id: userId, name: 'Sarah Fukiko', age: 24, gender: 'Female', category: 'Student', savedProfile: true }], createdAt: `${date}T08:45:00+08:00` };
    return [{ ...base, _id: 'client-paid', bookingReference: 'GG-CLIENT-PAID', status: 'CONFIRMED', paymentStatus: 'VERIFIED', totalPaid: 105 }, { ...base, _id: 'client-processing', bookingReference: 'GG-CLIENT-PENDING', origin: 'Guimaras', destination: 'Iloilo', paymentMethod: 'Maya', status: 'PENDING PAYMENT VERIFICATION', paymentStatus: 'PENDING VERIFICATION' }, { ...base, _id: 'client-failed', bookingReference: 'GG-CLIENT-FAILED', status: 'REJECTED', paymentStatus: 'REJECTED' }];
}
