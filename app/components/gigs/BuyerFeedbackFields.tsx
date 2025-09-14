import React from "react";
import { Send } from "lucide-react";
import {
  BuyerFeedbackFormData,
  GigDetails,
} from "@/app/types/GigFeedbackTypes";
import styles from "@/app/(web-client)/user/[userId]/buyer/gigs/[gigId]/feedback/FeedbackPage.module.css";
import stylesFeed from "@/app/components/gigs/Feedback.module.css";
import stylesLoader from "@/app/components/shared/Loader.module.css"; // Adjust the path as necessary
import AwardDisplayBadge from "../profile/AwardDisplayBadge";

type BuyerFeedbackFieldsProps = {
  gigDetails: GigDetails;
  formData: BuyerFeedbackFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  submitting?: boolean;
  onToggleTopCommunicator: () => void;
  onToggleTeamBuilder: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
};

const BuyerFeedbackFields: React.FC<BuyerFeedbackFieldsProps> = ({
  gigDetails,
  formData,
  onChange,
  submitting,
  onToggleTopCommunicator,
  onToggleTeamBuilder,
  // onThumbsUp,
  // onThumbsDown,
}) => (
  <div className={stylesFeed.buyerFeedbackContainer}>
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>1</span>
      </div>
      <div className={`${stylesFeed.textareaContainer} ${styles.stepContent}`}>
        <label htmlFor="publicComment" className={styles.label}>
          Public Comment (visible on {gigDetails.workerName.split(" ")[0]}
          &apos;s profile):
        </label>
        <textarea
          id="publicComment"
          name="publicComment"
          className={`${stylesFeed.textarea}`}
          placeholder="e.g., Punctual, professional, great skills..."
          value={formData.publicComment}
          onChange={onChange}
          aria-label="Public comment"
        />
      </div>
    </div>
    <div className={`${stylesFeed.textareaContainer} ${styles.stepItem}`}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>2</span>
      </div>

      <div className={styles.stepContent}>
        <label htmlFor="privateNotes" className={styles.label}>
          Private Notes for Able AI (optional):
        </label>
        <textarea
          id="privateNotes"
          name="privateNotes"
          className={stylesFeed.textarea}
          placeholder="Any internal notes about this worker or gig?"
          value={formData.privateNotes}
          onChange={onChange}
          aria-label="Private notes"
        />
      </div>
    </div>
    <div className={`${styles.stepItem}`}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>3</span>
      </div>
      <div className={styles.stepContent}>
        <label className={`${stylesFeed.workAgainText} ${styles.label}`}>
          Would you hire {gigDetails.workerName.split(" ")[0]} again?{" "}
          <span className="text-primary">*</span>
        </label>
        <div className={styles.hireAgainOptions}>
          <label
            className={`${styles.hireAgainOptionLabel} ${
              formData.wouldHireAgain === "yes"
                ? styles.hireAgainOptionLabelChecked
                : ""
            }`}
          >
            <input
              type="radio"
              name="wouldHireAgain"
              value="yes"
              checked={formData.wouldHireAgain === "yes"}
              onChange={onChange}
              aria-label="Would hire again: Yes"
            />
            Yes
          </label>
          <label
            className={`${styles.hireAgainOptionLabel} ${
              formData.wouldHireAgain === "maybe"
                ? styles.hireAgainOptionLabelChecked
                : ""
            }`}
          >
            <input
              type="radio"
              name="wouldHireAgain"
              value="maybe"
              checked={formData.wouldHireAgain === "maybe"}
              onChange={onChange}
              aria-label="Would hire again: Maybe"
            />
            Maybe
          </label>
          <label
            className={`${styles.hireAgainOptionLabel} ${
              formData.wouldHireAgain === "no"
                ? styles.hireAgainOptionLabelChecked
                : ""
            }`}
          >
            <input
              type="radio"
              name="wouldHireAgain"
              value="no"
              checked={formData.wouldHireAgain === "no"}
              onChange={onChange}
              aria-label="Would hire again: No"
            />
            No
          </label>
        </div>
      </div>
    </div>
    {formData.wouldHireAgain === "yes" && (
      <div className={styles.stepItem}>
        <div className={styles.stepIndicator}>
          <span className={styles.stepNumber}>4</span>
        </div>
        <div className={`${styles.stepContent} ${stylesFeed.awardContainer}`}>
          <h3 className={stylesFeed.awardTitle}>
            Would you like to award{" "}
            <span className={stylesFeed.workerName}>
              {gigDetails.workerName.split(" ")[0]}
            </span>
            ?
          </h3>
          <div className={stylesFeed.badgeContainer}>
            <button
              type="button"
              className={stylesFeed.badgeButton}
              onClick={onToggleTopCommunicator}
              aria-label="Top communicator award"
            >
              <AwardDisplayBadge
                icon="topChef"
                title="Top communicator"
                role="buyer"
                type="COMMON"
              />
            </button>
            <button
              type="button"
              className={stylesFeed.badgeButton}
              onClick={onToggleTeamBuilder}
              aria-label="Team builder award"
            >
              <AwardDisplayBadge
                icon="topChef"
                title="Top communicator"
                role="buyer"
                type="COMMON"
              />
            </button>
          </div>
        </div>
      </div>
    )}
    <div className={styles.stepItem}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber}>5</span>
      </div>
      <div className={`${styles.submitButtonContainer} ${styles.stepContent}`}>
        <button
          type="submit"
          className={stylesFeed.releaseButton}
          disabled={submitting}
          aria-label="Submit feedback"
        >
          {submitting ? (
            <div className={stylesFeed.loaderContainer}>
              <div className={stylesLoader.loader}></div>
            </div>
          ) : (
            <>
              <Send size={16} /> End gig, release payment
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default BuyerFeedbackFields;
