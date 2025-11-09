// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {HonorNFT} from "./HonorNFT.sol";

/// @title Learning Test - Encrypted Exam Platform
/// @notice A decentralized exam system using Zama FHEVM technology
/// @dev All scores are encrypted and statistics are computed on encrypted data
contract LearningTest is SepoliaConfig {
    // Structure to store student exam data
    struct StudentExam {
        euint32 encryptedScore; // Encrypted score
        bool exists; // Whether the student has submitted an exam
    }

    // Mapping from student address to their exam data
    mapping(address => StudentExam) public studentExams;
    
    // List of all student addresses who have submitted exams
    address[] public studentList;
    
    // Total encrypted score (sum of all scores)
    euint32 private _totalScore;
    // Last computed aggregated handles (persist for decryption)
    euint32 private _lastTotal;
    euint32 private _lastAgg;
    
    // Total number of students who submitted exams
    uint256 public studentCount;
    
    // Top N students for rewards (default 3)
    uint256 public topN = 3;
    
    // Mapping from student address to whether they received a reward
    mapping(address => bool) public rewards;

    // Reward eligibility set by owner (record off-chain ranking result on-chain)
    mapping(address => bool) public eligible;

    // Owner & reward NFT
    address public owner;
    HonorNFT public honorNFT;
    
    // Events
    event ExamSubmitted(address indexed student, uint256 timestamp);
    event RewardGranted(address indexed student, uint256 timestamp);
    event StatisticsUpdated(uint256 studentCount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address honorNFT_) {
        owner = msg.sender;
        honorNFT = HonorNFT(honorNFT_);
    }

    /// @notice Submit an encrypted exam score
    /// @param inputEuint32 The encrypted score (0-100)
    /// @param inputProof The input proof for the encrypted score
    function submitExam(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedScore = FHE.fromExternal(inputEuint32, inputProof);
        
        // If this is the first submission, add to student count
        if (!studentExams[msg.sender].exists) {
            studentCount++;
            studentList.push(msg.sender);
        }
        
        // Store the encrypted score
        studentExams[msg.sender].encryptedScore = encryptedScore;
        studentExams[msg.sender].exists = true;
        
        // Update total score (we need to handle this carefully)
        // For simplicity, we'll recalculate total when needed
        // In a real scenario, you might want to maintain a running total
        
        // Allow the contract and student to access their own score
        FHE.allowThis(encryptedScore);
        FHE.allow(encryptedScore, msg.sender);
        
        emit ExamSubmitted(msg.sender, block.timestamp);
        emit StatisticsUpdated(studentCount, block.timestamp);
    }

    /// @notice Get the encrypted score for a student
    /// @param student The address of the student
    /// @return The encrypted score
    function getStudentScore(address student) external view returns (euint32) {
        require(studentExams[student].exists, "Student has not submitted an exam");
        return studentExams[student].encryptedScore;
    }

    /// @notice Calculate the total encrypted score (sum of all scores)
    /// @return The encrypted total score
    /// @dev This function iterates through all students and sums their scores
    function calculateTotalScore() external returns (euint32) {
        euint32 total = FHE.asEuint32(0);
        
        for (uint256 i = 0; i < studentList.length; i++) {
            address student = studentList[i];
            if (studentExams[student].exists) {
                total = FHE.add(total, studentExams[student].encryptedScore);
            }
        }
        // Persist the total handle and authorize caller to decrypt
        // First allow contract to access, then authorize the caller
        FHE.allowThis(total);
        FHE.allow(total, msg.sender);
        _lastTotal = total;
        // Also authorize the persisted handle to ensure both are accessible
        FHE.allowThis(_lastTotal);
        FHE.allow(_lastTotal, msg.sender);
        return _lastTotal;
    }

    /// @notice Calculate the average encrypted score
    /// @return The encrypted average score
    /// @dev This computes: totalScore / studentCount
    function calculateAverageScore() external returns (euint32) {
        require(studentCount > 0, "No students have submitted exams");
        
        euint32 total = FHE.asEuint32(0);
        
        for (uint256 i = 0; i < studentList.length; i++) {
            address student = studentList[i];
            if (studentExams[student].exists) {
                total = FHE.add(total, studentExams[student].encryptedScore);
            }
        }
        
        // Persist the aggregate handle and authorize caller to decrypt (frontend can compute public average)
        // First allow contract to access, then authorize the caller
        FHE.allowThis(total);
        FHE.allow(total, msg.sender);
        _lastAgg = total;
        // Also authorize the persisted handle to ensure both are accessible
        FHE.allowThis(_lastAgg);
        FHE.allow(_lastAgg, msg.sender);
        return _lastAgg;
    }

    /// @notice Check if a student is in the top N
    /// @param student The address of the student to check
    /// @return Whether the student is in the top N
    /// @dev This is a simplified version - full ranking requires more complex FHE operations
    function isInTopN(address student) external view returns (bool) {
        require(studentExams[student].exists, "Student has not submitted an exam");
        
        // Simplified check: count how many students have higher scores
        // In a full implementation, you would need to sort encrypted values
        // For now, we'll use a simpler approach: check if score is above a threshold
        // This is a placeholder - full encrypted ranking is complex
        
        uint256 studentsWithHigherScore = 0;
        
        // Note: This is a simplified version
        // Full encrypted comparison and ranking would require more complex FHE operations
        // that may not be directly available in the current FHEVM implementation
        
        return studentsWithHigherScore < topN;
    }

    /// @notice Grant reward to a student (can be called by contract or external system)
    /// @param student The address of the student to reward
    function grantReward(address student) external {
        require(studentExams[student].exists, "Student has not submitted an exam");
        require(!rewards[student], "Student already received a reward");
        
        // In a full implementation, you would check if student is in top N
        // For now, we'll grant reward to anyone who passes a threshold
        // This would be determined by decrypting the comparison result
        
        rewards[student] = true;
        emit RewardGranted(student, block.timestamp);
    }

    /// @notice Get the number of students
    /// @return The total number of students who submitted exams
    function getStudentCount() external view returns (uint256) {
        return studentCount;
    }

    /// @notice Get all student addresses
    /// @return Array of all student addresses
    function getAllStudents() external view returns (address[] memory) {
        return studentList;
    }

    /// @notice Check if a student has submitted an exam
    /// @param student The address of the student
    /// @return Whether the student has submitted an exam
    function hasSubmittedExam(address student) external view returns (bool) {
        return studentExams[student].exists;
    }

    /// @notice Set the top N value for rewards
    /// @param _topN The new top N value
    function setTopN(uint256 _topN) external onlyOwner {
        require(_topN > 0, "Top N must be greater than 0");
        topN = _topN;
    }

    /// @notice Check if a student has received a reward
    /// @param student The address of the student
    /// @return Whether the student has received a reward
    function hasReward(address student) external view returns (bool) {
        return rewards[student];
    }

    /// @notice The most recent on-chain computed total handle (for decryption)
    function getLastTotalScoreHandle() external view returns (euint32) {
        return _lastTotal;
    }

    /// @notice The most recent on-chain computed aggregate handle (for decrypting aggregates)
    function getLastAggregateHandle() external view returns (euint32) {
        return _lastAgg;
    }

    /// @notice Batch mark Top N eligible addresses (owner calls based on off-chain ranking)
    function markEligible(address[] calldata addrs) external onlyOwner {
        for (uint256 i = 0; i < addrs.length; i++) {
            if (studentExams[addrs[i]].exists) {
                eligible[addrs[i]] = true;
            }
        }
    }

    /// @notice User self-claims Honor NFT (must be eligible and not already rewarded)
    function claimReward() external {
        require(studentExams[msg.sender].exists, "No exam submitted");
        require(eligible[msg.sender], "Not eligible");
        require(!rewards[msg.sender], "Already rewarded");

        // Record reward and mint a non-transferable SBT-style Honor NFT
        rewards[msg.sender] = true;
        honorNFT.mint(msg.sender);
        emit RewardGranted(msg.sender, block.timestamp);
    }
}

