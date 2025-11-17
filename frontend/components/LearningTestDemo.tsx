"use client";

import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useLearningTest } from "@/hooks/useLearningTest";
import { useMemo, useState } from "react";

type ViewType = "dashboard" | "quiz" | "statistics" | "rewards" | "admin";

export const LearningTestDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [eligibleAddressInput, setEligibleAddressInput] = useState<string>("");

  //////////////////////////////////////////////////////////////////////////////
  // FHEVM instance
  //////////////////////////////////////////////////////////////////////////////

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  //////////////////////////////////////////////////////////////////////////////
  // useLearningTest hook
  //////////////////////////////////////////////////////////////////////////////

  const learningTest = useLearningTest({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  //////////////////////////////////////////////////////////////////////////////
  // UI Stuff
  //////////////////////////////////////////////////////////////////////////////

  const buttonClass =
    "relative inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-black " +
    "bg-gradient-to-r from-[#00ff88] to-[#00aaff] shadow-lg " +
    "transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] hover:scale-105 " +
    "active:scale-95 " +
    "disabled:opacity-40 disabled:pointer-events-none disabled:hover:shadow-none disabled:hover:scale-100";

  const secondaryButtonClass =
    "relative inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white " +
    "bg-[#1a1a1a] border-2 border-[#00ff88] shadow-lg " +
    "transition-all duration-300 hover:bg-[#00ff88] hover:text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] hover:scale-105 " +
    "active:scale-95 " +
    "disabled:opacity-40 disabled:pointer-events-none disabled:border-gray-600 disabled:hover:bg-[#1a1a1a] disabled:hover:text-white disabled:hover:scale-100";

  const titleClass = "text-xl font-bold gradient-text mb-4";
  const cardClass = "bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 card-glow animate-fadeIn";
  const inputClass = "w-full bg-[#0a0a0a] border-2 border-[#2a2a2a] rounded-lg px-4 py-3 text-white " +
    "focus:border-[#00ff88] focus:outline-none transition-colors duration-200";

  // Simple sample quiz (single choice), scored locally
  const questions = useMemo(
    () => [
      {
        id: 1,
        title: "What is the core feature of FHE?",
        options: [
          "Compute on plaintext",
          "Compute directly on ciphertext",
          "Only off-chain computation",
          "Only for symmetric encryption",
        ],
        correct: 1,
      },
      {
        id: 2,
        title: "Which privacy computing environment is used by this project?",
        options: ["ZK-SNARK", "TEE", "Zama FHEVM", "MPC"],
        correct: 2,
      },
      {
        id: 3,
        title: "What should the client do before submitting scores?",
        options: [
          "Upload plaintext score on-chain",
          "Encrypt the score with Relayer SDK",
          "Broadcast the score to a P2P network",
          "Send to a centralized server",
        ],
        correct: 1,
      },
    ],
    []
  );

  const handleSelect = (qid: number, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const handleSubmitQuiz = () => {
    const total = questions.length;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct) correct++;
    }
    const score = Math.round((correct * 100) / total);
    if (!learningTest.canSubmit) return;
    learningTest.submitExam(score);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="mb-8">
            <h1 className="text-6xl font-bold gradient-text mb-4">
              FHE Learning Platform
            </h1>
            <p className="text-gray-400 text-xl">
              Privacy-Preserving Exam System with Encrypted Scores
            </p>
          </div>
          <button
            className={buttonClass + " text-2xl px-12 py-6"}
            disabled={isConnected}
            onClick={connect}
          >
            🔐 Connect to MetaMask
          </button>
          <div className="mt-8 text-sm text-gray-500">
            <p>Powered by Zama FHEVM | Fully Homomorphic Encryption</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show deployment error if chainId is defined and contract is not deployed
  if (chainId !== undefined && learningTest.isDeployed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[#1a1a1a] border-2 border-red-500 rounded-xl p-8 animate-fadeIn">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">
              Contract Not Deployed
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              The LearningTest contract is not deployed on <span className="font-mono text-[#00ff88]">chainId={chainId}</span>
            </p>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-sm mb-2">Run this command to deploy:</p>
              <code className="text-[#00aaff] font-mono">cd backend && npm run deploy</code>
            </div>
            <button
              className={secondaryButtonClass}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard" as ViewType, icon: "📊", label: "Dashboard" },
    { id: "quiz" as ViewType, icon: "📝", label: "Quiz" },
    { id: "statistics" as ViewType, icon: "📈", label: "Statistics" },
    { id: "rewards" as ViewType, icon: "🏆", label: "Rewards" },
    ...(learningTest.isOwner ? [{ id: "admin" as ViewType, icon: "👑", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <h1 className="text-2xl font-bold gradient-text">FHE Platform</h1>
          <p className="text-xs text-gray-500 mt-1">Privacy-Preserving Exams</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id
                  ? "bg-gradient-to-r from-[#00ff88]/20 to-[#00aaff]/20 border-2 border-[#00ff88] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white border-2 border-transparent"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></div>
              <span className="text-xs text-gray-400">Connected</span>
            </div>
            {ethersSigner && (
              <p className="text-xs font-mono text-gray-300 truncate">
                {ethersSigner.address.slice(0, 6)}...{ethersSigner.address.slice(-4)}
              </p>
            )}
            <div className="flex gap-2 text-xs">
              <StatusBadge label="Chain" value={chainId?.toString() ?? "N/A"} color="blue" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00ff88]/10 to-[#00aaff]/10 border-b border-[#00ff88]/30 p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">
              {menuItems.find(item => item.id === currentView)?.label}
            </h2>
            <p className="text-gray-400">
              {currentView === "dashboard" && "Overview of your exam status and system information"}
              {currentView === "quiz" && "Test your knowledge about Fully Homomorphic Encryption"}
              {currentView === "statistics" && "Encrypted aggregation and analytics"}
              {currentView === "rewards" && "Claim your Honor NFT for outstanding performance"}
              {currentView === "admin" && "Administrative controls for managing student eligibility"}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Dashboard View */}
            {currentView === "dashboard" && (
              <>
                {/* System Status Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* FHEVM Status */}
                  <div className={cardClass}>
                    <h2 className={titleClass}>🔐 FHEVM Status</h2>
                    <div className="space-y-2">
                      <InfoRow label="Instance" value={fhevmInstance ? "✓ Ready" : "⏳ Loading"} highlight={!!fhevmInstance} />
                      <InfoRow label="Status" value={fhevmStatus} />
                      {fhevmError && <InfoRow label="Error" value={fhevmError} isError />}
                    </div>
                  </div>

                  {/* Contract Info */}
                  <div className={cardClass}>
                    <h2 className={titleClass}>📄 Contract</h2>
                    <div className="space-y-2">
                      <InfoRow label="Deployed" value={learningTest.isDeployed ? "✓ Yes" : "✗ No"} highlight={learningTest.isDeployed} />
                      <InfoRow 
                        label="Address" 
                        value={learningTest.contractAddress ? `${learningTest.contractAddress.slice(0, 8)}...` : "N/A"} 
                      />
                      <InfoRow label="Students" value={learningTest.studentCount?.toString() ?? "0"} />
                    </div>
                  </div>

                  {/* Operation Status */}
                  <div className={cardClass}>
                    <h2 className={titleClass}>⚡ Operations</h2>
                    <div className="space-y-2">
                      <InfoRow label="Can Submit" value={learningTest.canSubmit} />
                      <InfoRow label="Can Decrypt" value={learningTest.canDecrypt} />
                      <InfoRow label="Submitting" value={learningTest.isSubmitting} />
                    </div>
                  </div>
                </div>

                {/* Score Information */}
                <div className={cardClass}>
                  <h2 className={titleClass}>📊 My Score Data</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Encrypted Handle</p>
                      <p className="font-mono text-[#00aaff] break-all text-sm">
                        {learningTest.handle ?? "No score submitted yet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Decrypted Score</p>
                      {learningTest.isDecrypted ? (
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-bold text-[#00ff88]">
                            {learningTest.clear}
                          </span>
                          <span className="text-2xl font-bold text-[#00aaff]">
                            {(() => {
                              const s = Number(learningTest.clear ?? 0);
                              if (s >= 85) return "Grade A";
                              if (s >= 70) return "Grade B";
                              return "Grade C";
                            })()}
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Not decrypted yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    className={secondaryButtonClass + " py-4"}
                    disabled={!learningTest.canDecrypt}
                    onClick={learningTest.decryptScoreHandle}
                  >
                    {learningTest.canDecrypt
                      ? "🔓 Decrypt My Score"
                      : learningTest.isDecrypted
                        ? `✓ Score: ${learningTest.clear}`
                        : learningTest.isDecrypting
                          ? "🔄 Decrypting..."
                          : "⏸️ Nothing to Decrypt"}
                  </button>
                  <button
                    className={secondaryButtonClass + " py-4"}
                    disabled={!learningTest.canGetScore}
                    onClick={learningTest.refreshScoreHandle}
                  >
                    {learningTest.canGetScore
                      ? "🔄 Refresh Score Handle"
                      : "⏸️ Not Available"}
                  </button>
                </div>

                {/* System Messages */}
                {learningTest.message && (
                  <div className={cardClass + " border-[#00aaff]/50"}>
                    <h2 className={titleClass}>💬 System Messages</h2>
                    <div className="bg-[#0a0a0a] border border-[#00aaff]/30 rounded-lg p-4">
                      <p className="text-[#00aaff] font-mono text-sm">{learningTest.message}</p>
                    </div>
                  </div>
                )}
              </>
            )}


            {/* Quiz View */}
            {currentView === "quiz" && (
              <div className={cardClass}>
                <h2 className={titleClass}>📝 FHE Knowledge Quiz</h2>
                <p className="text-gray-400 mb-6">Test your knowledge about Fully Homomorphic Encryption</p>
                <div className="space-y-6">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-5 hover:border-[#00ff88]/30 transition-colors">
                      <p className="text-white font-semibold text-lg mb-4">
                        Question {q.id}: {q.title}
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {q.options.map((op, idx) => (
                          <label 
                            key={idx} 
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              answers[q.id] === idx 
                                ? 'bg-[#00ff88]/20 border-2 border-[#00ff88]' 
                                : 'bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#00aaff]/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === idx}
                              onChange={() => handleSelect(q.id, idx)}
                              className="w-4 h-4 accent-[#00ff88]"
                            />
                            <span className="text-gray-300">{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    className={buttonClass + " w-full text-lg py-4"}
                    disabled={!learningTest.canSubmit}
                    onClick={handleSubmitQuiz}
                  >
                    {learningTest.canSubmit ? "🚀 Submit Quiz (Encrypted Score)" : "⏳ Cannot Submit Yet"}
                  </button>
                </div>
              </div>
            )}


            {/* Statistics View */}
            {currentView === "statistics" && (
              <div className={cardClass}>
                <h2 className={titleClass}>📈 FHE Statistics & Aggregation</h2>
                <p className="text-gray-400 mb-4">Compute encrypted statistics without revealing individual scores</p>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Total Computation */}
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                    <h3 className="text-[#00ff88] font-semibold mb-3">Total Score</h3>
                    <div className="space-y-3">
                      <button 
                        className={secondaryButtonClass + " w-full"} 
                        onClick={learningTest.computeTotalHandle}
                      >
                        🔢 Compute Total
                      </button>
                      <button 
                        className={secondaryButtonClass + " w-full"} 
                        onClick={learningTest.decryptTotalHandle}
                      >
                        🔓 Decrypt Total
                      </button>
                      <div className="space-y-2 text-sm">
                        <InfoRow label="Encrypted Handle" value={learningTest.totalHandle ?? "Not computed"} />
                        <InfoRow label="Decrypted Total" value={learningTest.clearTotal ?? "Not decrypted"} highlight={!!learningTest.clearTotal} />
                      </div>
                    </div>
                  </div>

                  {/* Average Computation */}
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                    <h3 className="text-[#00aaff] font-semibold mb-3">Average Score</h3>
                    <div className="space-y-3">
                      <button 
                        className={secondaryButtonClass + " w-full"} 
                        onClick={learningTest.computeAvgHandle}
                      >
                        📊 Compute Average
                      </button>
                      <button 
                        className={secondaryButtonClass + " w-full"} 
                        onClick={learningTest.decryptAvgHandle}
                      >
                        🔓 Decrypt Average
                      </button>
                      <div className="space-y-2 text-sm">
                        <InfoRow label="Encrypted Handle" value={learningTest.avgHandle ?? "Not computed"} />
                        <InfoRow 
                          label="Public Average" 
                          value={(() => {
                            const total = Number(learningTest.clearTotal ?? learningTest.clearAvg ?? 0);
                            const n = Number(learningTest.studentCount ?? 0) || 1;
                            return (total && n) ? (total / n).toFixed(2) : "N/A";
                          })()} 
                          highlight={!!learningTest.clearTotal || !!learningTest.clearAvg}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rewards View */}
            {currentView === "rewards" && (
              <div className={cardClass + " border-[#00ff88]/50"}>
                <h2 className={titleClass}>🏆 Rewards & Recognition</h2>
                <p className="text-gray-400 mb-6">Claim your Honor NFT for outstanding performance</p>
                
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-gray-400 text-sm">Eligibility Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        {learningTest.isEligible ? (
                          <>
                            <span className="text-2xl">✅</span>
                            <span className="text-[#00ff88] font-semibold">Eligible</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">⏳</span>
                            <span className="text-gray-500">Not Eligible Yet</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Reward Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        {learningTest.hasReward ? (
                          <>
                            <span className="text-2xl">🎖️</span>
                            <span className="text-[#00aaff] font-semibold">NFT Claimed</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🎁</span>
                            <span className="text-gray-500">Not Claimed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!learningTest.isEligible && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <p className="text-yellow-400 text-sm">
                        ℹ️ You need to be marked as eligible by the contract owner to claim rewards.
                        {learningTest.isOwner && " As the owner, you can use the admin panel to mark addresses."}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  className={buttonClass + " w-full py-4 text-lg"}
                  disabled={!learningTest.isEligible || learningTest.hasReward}
                  onClick={learningTest.claimReward}
                >
                  {learningTest.hasReward 
                    ? "✓ NFT Already Claimed" 
                    : learningTest.isEligible 
                      ? "🎖️ Claim Honor NFT" 
                      : "🔒 Not Eligible"}
                </button>
              </div>
            )}

            {/* Admin View */}
            {currentView === "admin" && learningTest.isOwner && (
              <div className={cardClass + " border-[#00aaff]/50 bg-gradient-to-br from-[#00aaff]/5 to-[#1a1a1a]"}>
                <h2 className={titleClass}>👑 Admin Panel</h2>
                <p className="text-gray-400 mb-4">
                  Owner: <span className="font-mono text-[#00ff88]">{learningTest.contractOwner ?? "N/A"}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Wallet Address(es) - Comma separated for multiple
                    </label>
                    <input
                      type="text"
                      value={eligibleAddressInput}
                      onChange={(e) => setEligibleAddressInput(e.target.value)}
                      placeholder="0x1234...abcd, 0x5678...efgh"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      className={buttonClass + " flex-1"}
                      disabled={!eligibleAddressInput.trim()}
                      onClick={async () => {
                        if (!eligibleAddressInput.trim()) return;
                        try {
                          const addresses = eligibleAddressInput
                            .split(",")
                            .map(addr => addr.trim())
                            .filter(addr => addr.length > 0);
                          
                          if (addresses.length === 0) {
                            alert("Please enter at least one address");
                            return;
                          }
                          
                          for (const addr of addresses) {
                            if (!ethers.isAddress(addr)) {
                              alert(`Invalid address: ${addr}`);
                              return;
                            }
                          }
                          
                          await learningTest.markEligible(addresses);
                          setEligibleAddressInput("");
                        } catch (e: any) {
                          alert(`Error: ${e?.message || String(e)}`);
                        }
                      }}
                    >
                      ✓ Mark as Eligible
                    </button>
                    <button
                      className={secondaryButtonClass}
                      onClick={async () => {
                        if (!ethersSigner) return;
                        const addr = await ethersSigner.getAddress();
                        setEligibleAddressInput(addr);
                      }}
                    >
                      📋 My Address
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    💡 Mark top-performing students as eligible based on off-chain ranking. Supports batch operations.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
function StatusBadge({ label, value, color }: { label: string; value: string; color: "green" | "blue" }) {
  const colorClasses = color === "green" 
    ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]" 
    : "bg-[#00aaff]/10 border-[#00aaff]/30 text-[#00aaff]";
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colorClasses}`}>
      <span className="text-xs text-gray-400">{label}:</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  highlight = false, 
  isError = false 
}: { 
  label: string; 
  value: unknown; 
  highlight?: boolean;
  isError?: boolean;
}) {
  let displayValue: string;
  let valueColor = "text-gray-300";

  if (typeof value === "boolean") {
    displayValue = value ? "✓ Yes" : "✗ No";
    valueColor = value ? "text-[#00ff88]" : "text-gray-500";
  } else if (typeof value === "string" || typeof value === "number") {
    displayValue = String(value);
    if (highlight) valueColor = "text-[#00ff88]";
    if (isError) valueColor = "text-red-400";
  } else if (typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
    valueColor = "text-gray-500";
  } else if (value === undefined) {
    displayValue = "undefined";
    valueColor = "text-gray-500";
  } else if (value instanceof Error) {
    displayValue = value.message;
    valueColor = "text-red-400";
  } else {
    displayValue = JSON.stringify(value);
  }

  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-mono text-sm font-semibold ${valueColor}`}>
        {displayValue}
      </span>
    </div>
  );
}

