import { useForm } from 'react-hook-form';

const MeetingMinutesInput = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-4">
        <label 
          htmlFor="meetingMinutes" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Meeting Minutes
        </label>
        <textarea
          id="meetingMinutes"
          {...register('meetingMinutes', {
            required: 'Meeting minutes are required',
            minLength: {
              value: 10,
              message: 'Meeting minutes must be at least 10 characters long'
            }
          })}
          rows={10}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.meetingMinutes ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Paste your meeting minutes here..."
          disabled={isLoading}
        />
        {errors.meetingMinutes && (
          <p className="mt-1 text-sm text-red-600">{errors.meetingMinutes.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating Tasks...' : 'Generate Tasks'}
      </button>
    </form>
  );
};

export default MeetingMinutesInput;
