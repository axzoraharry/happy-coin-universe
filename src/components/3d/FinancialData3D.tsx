import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Line,
  PerspectiveCamera,
  Environment,
  Float,
  Billboard
} from '@react-three/drei';
import * as THREE from 'three';

interface TransactionData {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: 'purchase' | 'refund' | 'validation';
  risk: 'low' | 'medium' | 'high';
}

interface SpendingCategory {
  name: string;
  amount: number;
  count: number;
  color: string;
}

interface ThreeD3DBarChartProps {
  data: SpendingCategory[];
}

function BarChart3D({ data }: ThreeD3DBarChartProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <group ref={groupRef}>
      {data.map((item, index) => {
        const height = (item.amount / maxAmount) * 5 + 0.5;
        const x = (index - data.length / 2) * 2;
        
        return (
          <group key={item.name} position={[x, height / 2, 0]}>
            <Box args={[1.5, height, 1]} position={[0, 0, 0]}>
              <meshStandardMaterial color={item.color} />
            </Box>
            
            {/* Category label */}
            <Billboard position={[0, height / 2 + 1, 0]}>
              <Text
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {item.name}
              </Text>
            </Billboard>
            
            {/* Amount label */}
            <Billboard position={[0, height / 2 + 0.5, 0]}>
              <Text
                fontSize={0.2}
                color="#888"
                anchorX="center"
                anchorY="middle"
              >
                ${item.amount.toFixed(0)}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

interface TransactionFlowProps {
  transactions: TransactionData[];
}

function TransactionFlow({ transactions }: TransactionFlowProps) {
  const particlesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, index) => {
        const time = state.clock.elapsedTime;
        child.position.x = Math.sin(time + index) * 3;
        child.position.z = Math.cos(time + index) * 3;
        child.position.y = Math.sin(time * 2 + index) * 1;
      });
    }
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa44';
      case 'low': return '#44ff44';
      default: return '#888888';
    }
  };

  return (
    <group ref={particlesRef}>
      {transactions.slice(0, 20).map((transaction, index) => (
        <Float
          key={transaction.id}
          speed={1 + index * 0.1}
          rotationIntensity={0.5}
          floatIntensity={0.5}
        >
          <Sphere 
            args={[Math.log(transaction.amount + 1) * 0.1]} 
            position={[
              (index % 5 - 2) * 2,
              Math.sin(index) * 2,
              (Math.floor(index / 5) - 2) * 2
            ]}
          >
            <meshStandardMaterial 
              color={getRiskColor(transaction.risk)}
              emissive={getRiskColor(transaction.risk)}
              emissiveIntensity={0.2}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

interface RiskVisualizationProps {
  riskData: {
    low: number;
    medium: number;
    high: number;
  };
}

function RiskVisualization({ riskData }: RiskVisualizationProps) {
  const ringRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
  });

  const total = riskData.low + riskData.medium + riskData.high;
  
  return (
    <group ref={ringRef} position={[0, 0, 0]}>
      {/* Low risk ring */}
      <mesh>
        <torusGeometry args={[3, 0.2, 8, 100, (riskData.low / total) * Math.PI * 2]} />
        <meshStandardMaterial color="#44ff44" />
      </mesh>
      
      {/* Medium risk ring */}
      <mesh rotation={[0, 0, (riskData.low / total) * Math.PI * 2]}>
        <torusGeometry args={[3.3, 0.2, 8, 100, (riskData.medium / total) * Math.PI * 2]} />
        <meshStandardMaterial color="#ffaa44" />
      </mesh>
      
      {/* High risk ring */}
      <mesh rotation={[0, 0, ((riskData.low + riskData.medium) / total) * Math.PI * 2]}>
        <torusGeometry args={[3.6, 0.2, 8, 100, (riskData.high / total) * Math.PI * 2]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
      
      {/* Center info */}
      <Billboard>
        <Text
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Risk Analysis
        </Text>
      </Billboard>
    </group>
  );
}

interface FinancialData3DProps {
  transactions: any[];
  spendingData: SpendingCategory[];
  view: '3d-bars' | 'transaction-flow' | 'risk-analysis';
}

export function FinancialData3D({ transactions, spendingData, view }: FinancialData3DProps) {
  const processedTransactions: TransactionData[] = useMemo(() => {
    return transactions.map(t => ({
      id: t.id,
      amount: Math.abs(t.amount),
      category: 'General', // We'll enhance this with AI categorization
      date: t.created_at,
      type: t.transaction_type,
      risk: Math.abs(t.amount) > 1000 ? 'high' : 
            Math.abs(t.amount) > 500 ? 'medium' : 'low'
    }));
  }, [transactions]);

  const riskData = useMemo(() => {
    const counts = processedTransactions.reduce((acc, t) => {
      acc[t.risk]++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });
    
    return counts;
  }, [processedTransactions]);

  const renderScene = () => {
    switch (view) {
      case '3d-bars':
        return <BarChart3D data={spendingData} />;
      case 'transaction-flow':
        return <TransactionFlow transactions={processedTransactions} />;
      case 'risk-analysis':
        return <RiskVisualization riskData={riskData} />;
      default:
        return <BarChart3D data={spendingData} />;
    }
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
        <spotLight 
          position={[0, 10, 0]} 
          angle={0.3} 
          penumbra={1} 
          intensity={1}
          castShadow
        />
        
        {/* Environment */}
        <Environment preset="city" />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
        
        {/* 3D Scene */}
        {renderScene()}
        
        {/* Grid floor */}
        <gridHelper args={[20, 20, '#333', '#666']} position={[0, -2, 0]} />
      </Canvas>
    </div>
  );
}