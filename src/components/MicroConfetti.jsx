import { motion } from 'framer-motion';

const MicroConfetti = ({ show }) => {
  if (!show) return null;

  const particles = [
    { x: -40, y: -60, rotate: 45, color: '#10b981', delay: 0 },
    { x: 40, y: -50, rotate: -45, color: '#6366f1', delay: 0.05 },
    { x: -30, y: -70, rotate: 90, color: '#f59e0b', delay: 0.1 },
    { x: 30, y: -65, rotate: -90, color: '#ec4899', delay: 0.15 },
    { x: 0, y: -80, rotate: 180, color: '#8b5cf6', delay: 0.08 },
    { x: -20, y: -55, rotate: 135, color: '#14b8a6', delay: 0.12 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [1, 0.8, 0.4],
            x: particle.x,
            y: particle.y,
            rotate: particle.rotate,
          }}
          transition={{
            duration: 0.4,
            delay: particle.delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        />
      ))}
    </div>
  );
};

export default MicroConfetti;
