import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const client = new MongoClient(process.env.MONGODB_URI);

const RAW_CHALLENGES = [
  // CODE STATE 01 — "QUANTA"
  { id: 'ch-01', observationPoint: 'OBSERVATION POINT 01', locationClue: 'KNOWLEDGE IS STORED WHERE INFORMATION OUTLIVES ITS OBSERVER.', locationSignal: 'Find the place where thousands of states are stored without being measured.', type: 'riddle', prompt: 'In quantum mechanics, what phenomenon allows a particle to exist in multiple states simultaneously until it is measured?', hint: 'Think about what happens to a quantum system before observation — it exists in all possible states at once.', answer: 'Superposition', options: ['Entanglement', 'Superposition', 'Interference', 'Decoherence'], codeIndex: 0, fragmentIndex: 0 },
  { id: 'ch-02', observationPoint: 'OBSERVATION POINT 02', locationClue: 'ENERGY IS TRANSFERRED WHERE SUSTENANCE FUELS THE OBSERVER.', locationSignal: 'Find where the quantum pioneers refuel before their next measurement.', type: 'campus', prompt: 'What is the term for the minimum discrete unit of energy that can be absorbed or emitted by a quantum system?', hint: 'Einstein won the Nobel Prize for explaining this using light.', answer: 'Quantum', options: ['Photon', 'Electron', 'Quantum', 'Quark'], codeIndex: 0, fragmentIndex: 1 },
  { id: 'ch-03', observationPoint: 'OBSERVATION POINT 03', locationClue: 'ADMINISTRATION IS THE BACKBONE BEHIND EVERY OBSERVATION SYSTEM.', locationSignal: 'Where campus decisions are structured and authority is centralised.', type: 'logic', prompt: 'A quantum circuit begins with |0⟩. After applying a Hadamard gate followed by a measurement, what are the two possible outcomes?', hint: 'After the Hadamard gate, the qubit is in equal superposition of two classical states.', answer: '0 and 1', options: ['Only 0', 'Only 1', '0 and 1', 'Neither'], codeIndex: 0, fragmentIndex: 2 },
  { id: 'ch-04', observationPoint: 'OBSERVATION POINT 04', locationClue: 'SIGNALS TRAVEL FASTEST WHERE INFRASTRUCTURE CONNECTS EVERYTHING.', locationSignal: 'Find the node where power and data flow together, sustaining the entire campus network.', type: 'quantum', prompt: 'What quantum gate is represented by the matrix [[0,1],[1,0]]? It flips the qubit state from |0⟩ to |1⟩ and vice versa.', hint: 'In classical computing, this is equivalent to a NOT gate.', answer: 'Pauli-X', options: ['Hadamard', 'Pauli-X', 'Pauli-Z', 'CNOT'], codeIndex: 0, fragmentIndex: 3 },
  { id: 'ch-05', observationPoint: 'OBSERVATION POINT 05', locationClue: 'HEALING AND MEASUREMENT COEXIST WHERE LIVES ARE OBSERVED AND STABILISED.', locationSignal: 'Where the campus monitors vitals and restores coherence to fragile systems.', type: 'pattern', prompt: 'Complete the quantum sequence: H|0⟩ → |+⟩, H|1⟩ → |−⟩, H|+⟩ → ?, H|−⟩ → ?', hint: 'The Hadamard gate is its own inverse.', answer: '|0⟩ and |1⟩', options: ['|+⟩ and |−⟩', '|0⟩ and |1⟩', '|1⟩ and |0⟩', '|−⟩ and |+⟩'], codeIndex: 0, fragmentIndex: 4 },
  { id: 'ch-06', observationPoint: 'OBSERVATION POINT 06', locationClue: 'THE FINAL STATE OF CODE 01 COLLAPSES AT THE FOUNDATION OF ALL LEARNING.', locationSignal: 'Where structured knowledge is delivered and coherence is taught.', type: 'sequence', prompt: 'Qiskit is IBM\'s open-source quantum computing framework. What does "Qiskit" stand for?', hint: 'It refers to the set of tools and components.', answer: 'Quantum Information Science Kit', options: ['Quantum Integrated System Kit', 'Quantum Information Science Kit', 'Quantum Instruction Set Kit', 'Quantum Interface Science Kit'], codeIndex: 0, fragmentIndex: 5 },
  // CODE STATE 02 — "QISKIT"
  { id: 'ch-07', observationPoint: 'OBSERVATION POINT 07', locationClue: 'CONNECTIONS MULTIPLY THROUGH SOCIAL HUBS WHERE OBSERVERS GATHER.', locationSignal: 'Find the campus node where groups of students naturally converge between measurements.', type: 'quantum', prompt: 'Two qubits are described as entangled when their quantum states cannot be described independently. Which famous physicist called this "spooky action at a distance"?', hint: 'This physicist also described quantum mechanics as incomplete.', answer: 'Albert Einstein', options: ['Niels Bohr', 'Erwin Schrödinger', 'Albert Einstein', 'Richard Feynman'], codeIndex: 1, fragmentIndex: 0 },
  { id: 'ch-08', observationPoint: 'OBSERVATION POINT 08', locationClue: 'STRUCTURED RESEARCH OCCURS WHERE EXPERIMENTS ARE CONDUCTED AND DATA IS MEASURED.', locationSignal: 'Where the campus isolates systems and performs controlled observations.', type: 'hidden', prompt: 'In quantum error correction, what is the minimum number of physical qubits needed to encode one logical qubit using the bit-flip code?', hint: 'The name of this code contains the answer.', answer: '3', options: ['2', '3', '5', '7'], codeIndex: 1, fragmentIndex: 1 },
  { id: 'ch-09', observationPoint: 'OBSERVATION POINT 09', locationClue: 'ALGORITHMS ARE DESIGNED WHERE THEORETICAL STATES ARE EXPLORED IN DEPTH.', locationSignal: 'Find where the campus processes abstract information and resolves complex theoretical states.', type: 'logic', prompt: "Grover's algorithm provides a quantum speedup for searching unsorted databases. If a classical computer requires N steps, how many steps does Grover's algorithm require?", hint: "Grover's quantum speedup is quadratic.", answer: 'Square root of N', options: ['N/2', 'Square root of N', 'Log N', 'N^2'], codeIndex: 1, fragmentIndex: 2 },
  { id: 'ch-10', observationPoint: 'OBSERVATION POINT 10', locationClue: 'PHYSICAL INFRASTRUCTURE ANCHORS THE CAMPUS POWER GRID TO OBSERVABLE REALITY.', locationSignal: 'Find the point where raw energy is transformed and distributed across the entire system.', type: 'campus', prompt: 'Quantum decoherence describes how a quantum system loses its quantum properties. What is the primary enemy of quantum coherence in real quantum computers?', hint: 'It is the unwanted interaction between the environment and the system.', answer: 'Noise', options: ['Gravity', 'Light', 'Noise', 'Magnetism'], codeIndex: 1, fragmentIndex: 3 },
  { id: 'ch-11', observationPoint: 'OBSERVATION POINT 11', locationClue: 'MULTIPLE PATHS CONVERGE WHERE THE CAMPUS CENTRALISES TRANSIT AND MOVEMENT.', locationSignal: 'Find where observers transition between locations — the junction of physical campus trajectories.', type: 'visual', prompt: 'In Bloch sphere representation, a qubit in the |0⟩ state points in which direction on the sphere?', hint: 'The Bloch sphere places two classical states at opposite poles.', answer: 'North Pole', options: ['North Pole', 'South Pole', 'Equator', 'Center'], codeIndex: 1, fragmentIndex: 4 },
  { id: 'ch-12', observationPoint: 'OBSERVATION POINT 12', locationClue: 'THE SECOND CODE STATE FINALISES WHERE BOOKS AND DATA CONVERGE.', locationSignal: 'The repository of structured information — find the campus system that catalogues all knowledge states.', type: 'quantum', prompt: 'What is the quantum gate that creates a controlled NOT — applying an X gate to the target qubit only when the control qubit is |1⟩?', hint: 'This gate is essential for creating quantum entanglement.', answer: 'CNOT', options: ['SWAP', 'Toffoli', 'CNOT', 'CZ'], codeIndex: 1, fragmentIndex: 5 },
  // CODE STATE 03 — "PHOTON"
  { id: 'ch-13', observationPoint: 'OBSERVATION POINT 13', locationClue: 'THE FIRST FRAGMENT OF CODE 03 AWAITS WHERE CREATIVE INFORMATION IS SHARED OPENLY.', locationSignal: 'Find where campus expression and communication meet — the open broadcast node of campus culture.', type: 'riddle', prompt: "Shor's algorithm can break RSA encryption by factoring large numbers exponentially faster than classical computers. What quantum phenomenon does it exploit?", hint: 'It involves converting the factoring problem into a period-finding problem.', answer: 'Quantum Fourier Transform', options: ['Quantum Teleportation', 'Quantum Fourier Transform', 'Quantum Phase Estimation', 'Quantum Walk'], codeIndex: 2, fragmentIndex: 0 },
  { id: 'ch-14', observationPoint: 'OBSERVATION POINT 14', locationClue: 'SUSTENANCE FLOWS WHERE THE CAMPUS COMMUNITY GATHERS TO RESTORE ENERGY.', locationSignal: 'Find the location that serves as the primary energy restoration point for campus observers.', type: 'sequence', prompt: 'What family of single-qubit gates is named after the physicist who proposed foundational quantum mechanics matrices — H, X, Y, and Z gates?', hint: 'These include the Hadamard gate and three rotation gates.', answer: 'Pauli', options: ['Dirac', 'Heisenberg', 'Pauli', 'Bohr'], codeIndex: 2, fragmentIndex: 1 },
  { id: 'ch-15', observationPoint: 'OBSERVATION POINT 15', locationClue: 'MEASUREMENT POINT 15 IS HIDDEN WHERE TECHNICAL KNOWLEDGE MEETS APPLIED ENGINEERING.', locationSignal: 'Find the campus building dedicated to applied sciences and technical disciplines.', type: 'pattern', prompt: 'In quantum teleportation, what is transmitted between Alice and Bob?', hint: 'Physical matter cannot be teleported.', answer: 'Quantum State', options: ['Physical Particle', 'Energy', 'Quantum State', 'Dark Matter'], codeIndex: 2, fragmentIndex: 2 },
  { id: 'ch-16', observationPoint: 'OBSERVATION POINT 16', locationClue: 'INFORMATION IS PROCESSED WHERE COMPUTATION AND RESEARCH CONVERGE IN DEDICATED SPACE.', locationSignal: 'Find the building where algorithms are born and computational states are resolved.', type: 'logic', prompt: 'A Bell state is a maximally entangled quantum state of two qubits. How many distinct Bell states exist?', hint: 'Bell states form a complete basis for the two-qubit Hilbert space.', answer: '4', options: ['2', '4', '8', '16'], codeIndex: 2, fragmentIndex: 3 },
  { id: 'ch-17', observationPoint: 'OBSERVATION POINT 17', locationClue: 'THE PENULTIMATE STATE COLLAPSES WHERE THE CAMPUS TRANSITIONS BETWEEN INTERNAL AND EXTERNAL.', locationSignal: 'Find the threshold — the point where the campus boundary meets the outer system.', type: 'hidden', prompt: "IBM's quantum computers use which type of qubit technology that must be cooled to near absolute zero — approximately 15 millikelvin?", hint: "These qubits are fabricated using circuits.", answer: 'Superconducting', options: ['Trapped Ion', 'Photonic', 'Superconducting', 'Topological'], codeIndex: 2, fragmentIndex: 4 },
  { id: 'ch-18', observationPoint: 'OBSERVATION POINT 18 — FINAL', locationClue: 'ALL STATES CONVERGE. THE QUANTUM TREASURE AWAITS AT THE ORIGIN POINT.', locationSignal: 'Return to where this measurement journey began. The source of the quantum signal.', type: 'final', prompt: 'In what year did IBM first make a quantum computer available to the public via the cloud, beginning what IBM calls the "Quantum Era"?', hint: 'Think about when quantum computing became accessible to everyone via the cloud.', answer: '2016', options: ['2012', '2014', '2016', '2019'], codeIndex: 2, fragmentIndex: 5 },
];

const CODE_WORDS = ['QUANTA', 'QISKIT', 'PHOTON'];

function hashAnswer(answer: string) {
  const norm = answer.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(norm).digest('hex');
}

// A list of dummy messages to display when a dummy challenge is solved
const DUMMY_MESSAGES = [
  'The quantum trail continues...',
  'You are close. Keep searching.',
  'The signal exists somewhere nearby.',
  'Wrong frequency. Try another quantum node.',
  'The hunt has not collapsed yet.',
  'Interesting signal... but no fragment here.',
  'Keep exploring the campus.'
];

async function seed() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Clearing existing collections...');
    await db.collection('GameWord').deleteMany({});
    await db.collection('GameLetter').deleteMany({});
    await db.collection('QRChallenge').deleteMany({});
    
    console.log('Inserting game words...');
    const wordDocs = CODE_WORDS.map((w, i) => ({
      wordName: `Word0${i+1}`,
      secretWord: w,
      position: i,
    }));
    
    const wordInsert = await db.collection('GameWord').insertMany(wordDocs);
    const wordIds = Object.values(wordInsert.insertedIds);
    
    console.log('Inserting game letters...');
    const letterDocs: any[] = [];
    for (let w = 0; w < CODE_WORDS.length; w++) {
      const wordId = wordIds[w];
      const wordStr = CODE_WORDS[w];
      for (let l = 0; l < wordStr.length; l++) {
        letterDocs.push({
          wordId,
          position: l,
          letterValue: wordStr[l]
        });
      }
    }
    const letterInsert = await db.collection('GameLetter').insertMany(letterDocs);
    const letterIds = Object.values(letterInsert.insertedIds);
    
    console.log('Inserting REAL QR challenges...');
    const challengeDocs = RAW_CHALLENGES.map((ch, i) => {
      const wId = wordIds[ch.codeIndex];
      const letterIndex = letterDocs.findIndex(l => l.wordId.equals(wId) && l.position === ch.fragmentIndex);
      const letterId = letterIds[letterIndex];
      
      return {
        publicToken: `token_${crypto.randomBytes(8).toString('hex')}`,
        type: 'REAL',
        observationPoint: ch.observationPoint,
        locationClue: ch.locationClue,
        locationSignal: ch.locationSignal,
        challengeType: ch.type,
        prompt: ch.prompt,
        options: ch.options,
        hint: ch.hint,
        answerHash: hashAnswer(ch.answer),
        active: true,
        letterId,
        dummyMessage: null // Real challenges don't have dummy messages
      };
    });
    
    console.log('Generating 82 DUMMY QR challenges...');
    // We want 100 QRs total, we have 18 real. So we need 82 dummy QRs.
    // They will randomly pick a question from the real challenges to disguise themselves.
    for (let i = 0; i < 82; i++) {
      const randomChallenge = RAW_CHALLENGES[Math.floor(Math.random() * RAW_CHALLENGES.length)];
      const randomDummyMessage = DUMMY_MESSAGES[Math.floor(Math.random() * DUMMY_MESSAGES.length)];
      
      challengeDocs.push({
        publicToken: `token_${crypto.randomBytes(8).toString('hex')}`,
        type: 'DUMMY',
        observationPoint: `UNKNOWN NODE ${Math.floor(100 + Math.random() * 900)}`,
        locationClue: 'Random fluctuations in the quantum field.',
        locationSignal: 'Somewhere on campus.',
        challengeType: 'hidden',
        prompt: randomChallenge.prompt,
        options: randomChallenge.options,
        hint: randomChallenge.hint,
        answerHash: hashAnswer(randomChallenge.answer), // They must answer correctly to clear the dummy
        active: true,
        letterId: null,
        dummyMessage: randomDummyMessage // This message is shown upon correct answer
      } as any);
    }

    await db.collection('QRChallenge').insertMany(challengeDocs);
    
    console.log('Seed complete! 100 QRs generated.');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
  }
}

seed();
