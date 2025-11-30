import mongoose from 'mongoose';

const SkillOfferSchema = new mongoose.Schema({
    // month/year are now optional: offers are global by default
    month: { type: String }, // optional
    year: { type: String }, // optional
    skill: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// unique per skill (global). If you need to allow duplicates per month, revisit.
SkillOfferSchema.index({ skill: 1 }, { unique: true });

export default mongoose.models.SkillOffer || mongoose.model('SkillOffer', SkillOfferSchema, 'skilloffers');
