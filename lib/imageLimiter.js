import pLimit from 'p-limit';

const limit = pLimit(5); // حداکثر ۵ پردازش تصویر همزمان

export default limit;
