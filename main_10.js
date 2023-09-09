import redisClient from './utils/redis';

const checking = async () => {
  await redisClient.set('change', '93374ddcdhdd', 100000);
  console.log(await redisClient.get('change'));
};

checking();
