import React, { useReducer, useState, useRef } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import './App.css';

const stateMachine = {
	initial: 'initial',
	states: {
		initial: { on: { next: 'loadingModel' } },
		loadingModel: { on: { next: 'awaitingUpload' } },
		awaitingUpload: { on: { next: 'ready' } },
		ready: { on: { next: 'classifying' }, showImage: true },
		classifying: { on: { next: 'complete' } },
		complete: {
			on: { next: 'awaitingUpload' },
			showImage: true,
			showResults: true,
		},
	},
};

const reducer = (state, event) =>
	stateMachine.states[state].on[event] || stateMachine.initial;

const formatResult = ({ name, probability }) => (
	<li key={name}>{`${name}: %${(probability * 100).toFixed(2)}`}</li>
);

function App() {
	tf.setBackend('cpu');

	const [state, dispatch] = useReducer(reducer, stateMachine.initial);

	const [model, setModel] = useState(null);

	const [imageURL, setImageURL] = useState(null);

	const [results, setResults] = useState([]);

	const imageRef = useRef();

	const inputRef = useRef();

	const loadModel = async (e) => {
		e.preventDefault();
		next();
		const mobilenetModel = await mobilenet.load();
		setModel(mobilenetModel);

		next();
	};

	const next = () => dispatch('next');

	const handleUpload = (e) => {
		const { files } = e.target;

		if (files.length > 0) {
			const url = URL.createObjectURL(files[0]);
			setImageURL(url);

			next();
		}
	};

	const reset = () => {
		setResults([]);
		setImageURL(null);
		next();
	};

	const identify = async () => {
		next();
		const results = await model.classify(imageRef.current);
		setResults(results);
		next();
	};

	const upload = () => inputRef.current.click();

	const buttonProps = {
		initial: { text: 'Load Mode', action: loadModel },
		loadingModel: { text: 'Loading...' },
		awaitingUpload: { text: 'Upload Photo', action: upload },
		ready: { text: 'Identify', action: identify },
		classifying: { text: 'Identifying' },
		complete: { text: 'Reset', action: reset },
	};

	const { showImage = false, showResults = false } = stateMachine.states[state];

	return (
		<div>
			<h1> Identify any dog with AI </h1>
			<h4> Get a breakdown of the dogs breed. </h4>

			{showImage && <img src={imageURL} alt="uploadPreview" ref={imageRef} />}

			<input
				type="file"
				accept="image/*"
				capture="camera"
				onChange={handleUpload}
				ref={inputRef}
			/>

			{showResults && <ul>{results.map(formatResult)}</ul>}

			<button onClick={buttonProps[state].action}>
				{' '}
				{buttonProps[state].text}{' '}
			</button>
		</div>
	);
}

export default App;
