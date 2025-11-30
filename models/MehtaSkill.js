import mongoose from 'mongoose';

const MehtaSkillSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// unique per skill
MehtaSkillSchema.index({ skill: 1 }, { unique: true });

export default mongoose.models.MehtaSkill || mongoose.model('MehtaSkill', MehtaSkillSchema, 'mehtaskills');
