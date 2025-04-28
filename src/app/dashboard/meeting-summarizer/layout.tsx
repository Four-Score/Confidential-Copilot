import { MeetingSummarizerStyles } from '@/features/meeting-summarizer/components/MeetingSummarizerStyles';

export default function MeetingSummarizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="meeting-summarizer">
      <MeetingSummarizerStyles />
      {children}
    </div>
  );
}