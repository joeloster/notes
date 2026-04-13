import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';

interface IndexProps {
  userId: string;
}

const Index = ({ userId }: IndexProps) => <InfiniteCanvas userId={userId} />;

export default Index;
