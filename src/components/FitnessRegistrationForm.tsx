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
	// No validation errors displayed

	// No validation: accept values as-is

	async function submit() {
		setSaving(true);
		try {
			const ref = doc(db, 'fitnessRegistrations', userId);
			const snap = await getDoc(ref);
			await setDoc(ref, {
				name: name,
				fathersName: fathersName,
				aadharCard: aadharCard,
				address: address,
				height: height,
				weight: weight,
				email: email,
				phone: phone,
				parentsPhone: parentsPhone,
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
			<h3 className="text-lg font-semibold mb-3">Assessment Registration</h3>
			<div className="grid gap-3 sm:grid-cols-2">
				<Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
				<Input label="Father's Name" value={fathersName} onChange={(e) => setFathersName(e.target.value)} />
				<Input label="Aadhar Card" value={aadharCard} onChange={(e) => setAadharCard(e.target.value)} />
				<Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
				<Input label="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
				<Input label="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
				<Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
				<Input label="Parent's Phone" value={parentsPhone} onChange={(e) => setParentsPhone(e.target.value)} />
			</div>
			<Button onClick={submit} disabled={saving} className="mt-4">{saving ? 'Saving...' : 'Start Tests'}</Button>
		</Card>
	);
}
