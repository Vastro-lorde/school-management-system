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
<<<<<<< HEAD
      return res.status(200).json({ success: true, value: cachedData });
=======
      return res.status(200).json(cachedData);
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
    }

    try {
      const setting = await Setting.findOne({ key: slug });
      if (!setting) {
<<<<<<< HEAD
        return res.status(404).json({ success: false, message: `Setting '${slug}' not found.` });
      }

      cacheService.set(cacheKey, setting.value);
      res.status(200).json({ success: true, value: setting.value });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
=======
        return res.status(404).json({ message: `Setting '${slug}' not found.` });
      }

      cacheService.set(cacheKey, setting.value);
      res.status(200).json(setting.value);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
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

<<<<<<< HEAD
      res.status(200).json({ success: true, message: `Setting '${slug}' updated successfully.` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  } else {
    res.status(405).json({ success: false, message: `Method ${req.method} not allowed.` });
=======
      res.status(200).json({ message: `Setting '${slug}' updated successfully.` });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  } else {
    res.status(405).json({ message: `Method ${req.method} not allowed.` });
>>>>>>> e50da2b2e2033560fea275d08c6786224d11e3ad
  }
}
