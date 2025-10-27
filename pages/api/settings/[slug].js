import dbConnect from '@/server/db/config';
import Setting from '@/server/db/models/Setting';
import ActivityLog from '@/server/db/models/ActivityLog';
import cacheService from '@/server/services/cacheService';

export default async function handler(req, res) {
  const { slug } = req.query;
  const cacheKey = `setting_${slug}`;

  await dbConnect();

  if (req.method === 'GET') {
    if (cacheService.has(cacheKey)) {
      const cachedData = cacheService.get(cacheKey);
      return res.status(200).json(cachedData);
    }

    try {
      const setting = await Setting.findOne({ key: slug });
      if (!setting) {
        return res.status(404).json({ message: `Setting '${slug}' not found.` });
      }

      cacheService.set(cacheKey, setting.value);
      res.status(200).json(setting.value);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  } else if (req.method === 'POST') {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: 'Data is required.' });
    }

    try {
      const updatedSetting = await Setting.findOneAndUpdate({ key: slug }, { value: data }, { new: true, upsert: true });

      // Log the activity
      await ActivityLog.create({
        action: 'update',
        entity: 'Setting',
        entityId: updatedSetting._id,
        details: { key: slug, newValue: data },
      });

      // Invalidate the cache
      cacheService.del(cacheKey);

      res.status(200).json({ message: `Setting '${slug}' updated successfully.` });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  } else {
    res.status(405).json({ message: `Method ${req.method} not allowed.` });
  }
}
