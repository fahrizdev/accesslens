import Modal from "./Modal";

export default function PrivacyDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Privacy & how it works" onClose={onClose}>
      <div className="privacy-copy">
        <h3>Name and email</h3>
        <p>
          Your name and email stay in this browser and get added to new reports.
          There’s no account, email verification, or mailing list. Change or
          remove them in Settings. Older reports keep the details already in
          their text. Adding an email here doesn’t connect your inbox. Sending
          uses the account in your mail app.
        </p>
        <h3>Saved reports and photos</h3>
        <p>
          Reports and photos are saved in this browser on this device. They
          don’t sync between devices. Download important reports before clearing
          browser data.
        </p>
        <h3>Sharing a report</h3>
        <p>
          Sharing opens another app with your photo and report text, including
          the place and any GPS pin you added. The official contact page opens
          separately. You still need to send the report yourself. Via doesn’t
          send it automatically.
        </p>
        <h3>Looking up your area</h3>
        <p>
          When you choose a location lookup, your address or GPS location goes
          through our server to the U.S. Census to find your district.
          Representative details come from the House Clerk. The app doesn’t save
          these lookups, though the hosting service may keep request logs.
          There’s no background tracking.
        </p>
        <h3>How the draft works</h3>
        <p>
          The draft uses the category, place, and notes you enter. This version
          doesn’t analyze your photo. Check the text before you share it. A
          report records what you noticed; it isn’t a legal or accessibility
          inspection. Your representative may be able to help or point you to
          someone else. Repairs may need to go through the city or property
          owner.
        </p>
      </div>
    </Modal>
  );
}
