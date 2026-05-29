import { useMemo, useState } from 'react';
import { formatTime } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import './VehicleShowcase.css';

const OFFICE_START = 7;  // 07:00
const OFFICE_END = 18;   // 18:00
const TOTAL_HOURS = OFFICE_END - OFFICE_START;
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = OFFICE_START + i;
  return h < 10 ? `0${h}` : `${h}`;
});

export default function ResourceShowcase({
  currentUserId,
  resources,
  bookings,
  config
}) {
  const {
    title,
    subtitle,
    headerIcon: HeaderIcon,
    headerIconClassName = '',
    getResourceId,
    getBookingResourceId,
    isMaintenance,
    isBookingOngoing,
    isBookingApproved,
    isBookingCompletedOrCancelled,
    renderCard,
    renderModalHeader,
    getSlotClassName,
    getTimelineNowClassName,
    timelineContainerClassName = "vs-timeline",
    timelineBarClassName = "vs-timeline-bar",
    timelineLegendClassName = "vs-timeline-legend",
    renderTimelineLegend,
    bookingListClassName = "vs-booking-list",
    bookingItemClassName = "vs-booking-item",
    renderBookingItem,
    emptyTimelineClassName = "vs-empty-timeline",
    emptyTimelineText = "Tersedia sepanjang hari."
  } = config;

  const [selectedResource, setSelectedResource] = useState(null);

  const todayBookings = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      if (isBookingCompletedOrCancelled(b)) return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start <= dayEnd && end >= dayStart;
    });
  }, [bookings, isBookingCompletedOrCancelled]);

  const resourceSchedule = useMemo(() => {
    if (!selectedResource) return [];
    return todayBookings
      .filter((b) => getBookingResourceId(b) === getResourceId(selectedResource))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [selectedResource, todayBookings, getBookingResourceId, getResourceId]);

  const activeResourceIds = useMemo(() => {
    const now = new Date();
    const activeIds = new Set();
    todayBookings.forEach(b => {
      const resId = getBookingResourceId(b);
      if (!resId) return;

      if (isBookingOngoing(b)) {
        activeIds.add(resId);
      } else if (isBookingApproved(b)) {
        if (now >= new Date(b.startTime) && now <= new Date(b.endTime)) {
          activeIds.add(resId);
        }
      }
    });
    return activeIds;
  }, [todayBookings, getBookingResourceId, isBookingOngoing, isBookingApproved]);

  const getStatusClass = (r) => {
    if (activeResourceIds.has(getResourceId(r))) return 'in-use';
    if (isMaintenance(r)) return 'maintenance';
    return 'available';
  };

  const getStatusLabel = (r) => {
    if (activeResourceIds.has(getResourceId(r))) return 'Dipakai';
    if (isMaintenance(r)) return 'Perawatan';
    return 'Tersedia';
  };

  const getSlotStyle = (booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    let startHour = start.getHours() + start.getMinutes() / 60;
    let endHour = end.getHours() + end.getMinutes() / 60;

    startHour = Math.max(startHour, OFFICE_START);
    endHour = Math.min(endHour, OFFICE_END);

    const leftPercent = ((startHour - OFFICE_START) / TOTAL_HOURS) * 100;
    const widthPercent = ((endHour - startHour) / TOTAL_HOURS) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

  const nowPosition = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour < OFFICE_START || hour > OFFICE_END) return null;
    return ((hour - OFFICE_START) / TOTAL_HOURS) * 100;
  }, []);

  return (
    <Card className="p-6 vs-root">
      <div className="vs-header">
        <div className="vs-header-text">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className={`vs-header-icon ${headerIconClassName}`}>
          <HeaderIcon size={20} />
        </div>
      </div>

      <div className="vs-grid">
        {resources.map((r) => {
          const statusCls = getStatusClass(r);
          const label = getStatusLabel(r);
          return (
            <div
              key={getResourceId(r)}
              onClick={() => statusCls !== 'maintenance' && setSelectedResource(r)}
              role="button"
              tabIndex={statusCls !== 'maintenance' ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && statusCls !== 'maintenance') setSelectedResource(r);
              }}
              className="vs-card-wrapper"
            >
              {renderCard(r, statusCls, label)}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        title={`Ketersediaan: ${selectedResource ? config.getResourceName(selectedResource) : ''}`}
        size="md"
      >
        {selectedResource && (
          <div>
            {renderModalHeader(selectedResource, getStatusClass(selectedResource), getStatusLabel(selectedResource))}

            <div className={timelineContainerClassName}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }} className="mb-3">
                Jadwal Hari Ini
              </p>

              <div className="vs-timeline-bar-wrapper">
                <div className="vs-timeline-hours">
                  {HOUR_LABELS.filter((_, i) => i % 2 === 0).map((h) => (
                    <span key={h}>{h}:00</span>
                  ))}
                </div>
                <div className={timelineBarClassName}>
                  {resourceSchedule.map((b) => (
                    <div
                      key={b.id}
                      className={`vs-timeline-slot ${getSlotClassName(b, b.userId === currentUserId)}`}
                      style={getSlotStyle(b)}
                      title={`${formatTime(b.startTime)}-${formatTime(b.endTime)}: ${b.keperluan}`}
                    >
                      {b.userName?.split(' ')[0]}
                    </div>
                  ))}
                  {nowPosition !== null && (
                    <div 
                      className={getTimelineNowClassName ? getTimelineNowClassName() : "vs-timeline-now"} 
                      style={{ left: `${nowPosition}%`, ...(getTimelineNowClassName ? { width: '2px', zIndex: 10 } : {}) }} 
                    />
                  )}
                </div>
              </div>

              <div className={timelineLegendClassName}>
                {renderTimelineLegend()}
              </div>
            </div>

            {resourceSchedule.length > 0 ? (
              <div className={bookingListClassName}>
                {config.renderBookingListHeader ? config.renderBookingListHeader() : (
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                    Detail Peminjaman
                  </p>
                )}
                
                {resourceSchedule.map((b) => (
                  <div key={b.id} className={bookingItemClassName}>
                    {renderBookingItem(b)}
                  </div>
                ))}
              </div>
            ) : (
              <div className={emptyTimelineClassName}>
                {emptyTimelineText}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
