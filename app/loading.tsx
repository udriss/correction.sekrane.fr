import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center mx-auto max-w-[400px] min-h-[70vh] bg-opacity-0">
      <LoadingSpinner 
        size="lg" 
        color="blue" 
        text="Chargement en cours "
      />
    </div>
  );
}
