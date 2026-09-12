export default function GlobalStyles() {
  return (
    <style jsx global>{`
      body { margin: 0; background: #F5F1E8; -webkit-font-smoothing: antialiased; }
      a { color: #E3402B; text-decoration: none; }
      a:hover { color: #201C16; }
      * { box-sizing: border-box; }
      input, select, textarea { font-family: 'Work Sans', sans-serif; }
      @keyframes heartPop { 0% { transform: scale(1); } 30% { transform: scale(1.5); } 60% { transform: scale(0.92); } 100% { transform: scale(1); } }
      @keyframes floatUp { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes celebratePop { 0% { transform: scale(0.7) rotate(-6deg); opacity: 0; } 60% { transform: scale(1.06) rotate(2deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      @keyframes toastIn { 0% { opacity: 0; transform: translate(-50%,16px); } 100% { opacity: 1; transform: translate(-50%,0); } }
      @keyframes pawPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
      @keyframes createPostPop { 0% { transform: scale(1); } 35% { transform: scale(0.85) rotate(-4deg); } 65% { transform: scale(1.12) rotate(3deg); } 100% { transform: scale(1) rotate(0deg); } }
      @keyframes loginTitleJump { 0% { transform: translateY(0); } 30% { transform: translateY(-14px) rotate(-2deg); } 55% { transform: translateY(0); } 75% { transform: translateY(-6px); } 100% { transform: translateY(0); } }
    `}</style>
  );
}
