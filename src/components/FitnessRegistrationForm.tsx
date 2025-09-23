import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firestore';

export default function FitnessRegistrationForm({ userId, onCompleted }: { userId: string; onCompleted: () => void }) {
	const [name, setName] = useState('');
	const [fathersName, setFathersName] = useState('');
	const [aadharCard, setAadharCard] = useState('');
	const [address, setAddress] = useState('');
	const [height, setHeight] = useState('');
	const [weight, setWeight] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [parentsPhone, setParentsPhone] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function validate() {
		const errs: string[] = [];
		if (!name.trim()) errs.push('Name');
		if (!fathersName.trim()) errs.push("Father's name");
		if (!aadharCard.trim() || aadharCard.trim().length !== 12) errs.push('Aadhar (12 digits)');
		if (!address.trim()) errs.push('Address');
		if (!height.trim()) errs.push('Height');
		if (!weight.trim()) errs.push('Weight');
		if (!email.trim()) errs.push('Email');
		if (!phone.trim() || phone.trim().length !== 10) errs.push('Phone (10 digits)');
		if (!parentsPhone.trim() || parentsPhone.trim().length !== 10) errs.push("Parent's phone (10 digits)");
		if (errs.length) {
			setError('Please correct: ' + errs.join(', '));
			return false;
		}
		setError(null);
		return true;
	}

	async function submit() {
		if (!validate()) return;
		setSaving(true);
		try {
			const ref = doc(db, 'fitnessRegistrations', userId);
			const snap = await getDoc(ref);
			await setDoc(ref, {
				name: name.trim(),
				fathersName: fathersName.trim(),
				aadharCard: aadharCard.trim(),
				address: address.trim(),
				height: Number(height),
				weight: Number(weight),
				email: email.trim(),
				phone: phone.trim(),
				parentsPhone: parentsPhone.trim(),
				completed: true,
				createdAt: snap.exists() ? snap.data()?.createdAt || Timestamp.now() : Timestamp.now(),
				updatedAt: Timestamp.now(),
			});
			onCompleted();
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="max-w-2xl mx-auto p-6">
			<h3 className="text-lg font-semibold mb-3">Fitness Test Registration</h3>
			<div className="grid gap-3 sm:grid-cols-2">
				<Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} required />
				<Input label="Father's Name *" value={fathersName} onChange={(e) => setFathersName(e.target.value)} required />
				<Input label="Aadhar Card *" value={aadharCard} onChange={(e) => setAadharCard(e.target.value.replace(/[^0-9]/g, ''))} required />
				<Input label="Address *" value={address} onChange={(e) => setAddress(e.target.value)} required />
				<Input label="Height (cm) *" type="number" value={height} onChange={(e) => setHeight(e.target.value)} required />
				<Input label="Weight (kg) *" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required />
				<Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				<Input label="Phone *" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} required />
				<Input label="Parent's Phone *" value={parentsPhone} onChange={(e) => setParentsPhone(e.target.value.replace(/[^0-9]/g, ''))} required />
			</div>
			{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
			<Button onClick={submit} disabled={saving} className="mt-4">{saving ? 'Saving...' : 'Start Tests'}</Button>
		</Card>
	);
}
