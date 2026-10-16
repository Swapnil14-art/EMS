'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Maximize2
} from 'lucide-react';

interface ParticipationDocViewerProps {
  url: string;
  title?: string;
  className?: string;
  fillContainer?: boolean;
  onError?: () => void;
}

// Client-side loader for the self-hosted standalone PDF.js bundle
function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib;
    if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
    return Promise.resolve(lib);
  }

  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[src="/pdf.min.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = '/pdf.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const checkReady = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        if (lib.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }
        resolve(lib);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    script.addEventListener('load', () => {
      if (!checkReady()) {
        setTimeout(() => {
          if (!checkReady()) {
            reject(new Error('PDF.js library failed to initialize'));
          }
        }, 50);
      }
    });

    script.addEventListener('error', () => {
      reject(new Error('Failed to load PDF viewer script'));
    });
  });
}

export default function ParticipationDocViewer({
  url,
  title = 'Participation Document',
  className = '',
  fillContainer = false,
  onError,
}: ParticipationDocViewerProps) {
  // Mobile / desktop state detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [forceCustomViewer, setForceCustomViewer] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Full-Screen Mobile Viewer state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // PDF.js rendering state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isImage = /\.(jpe?g|png|webp|svg|gif)(\?.*)?$/i.test(url);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // Dedicated refs for full-screen viewer container & pages
  const fullScreenScrollContainerRef = useRef<HTMLDivElement>(null);
  const fullScreenPageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fullScreenRenderTasksRef = useRef<Map<number, any>>(new Map());

  // Detect mobile device or mobile viewport width (< 768px)
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );
      const isMobileWidth = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      setIsMobile(isMobileUA || isMobileWidth);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close full-screen if resized to desktop
  useEffect(() => {
    if (!isMobile && isFullScreen) {
      setIsFullScreen(false);
      document.body.style.overflow = '';
    }
  }, [isMobile, isFullScreen]);

  // Lock body scroll while full-screen on mobile
  useEffect(() => {
    if (isFullScreen && isMobile) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullScreen, isMobile]);

  // Keyboard accessibility: Escape closes full-screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        handleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Load PDF document using PDF.js when mobile or forced custom viewer (and not an image)
  const loadPdfDocument = useCallback(async () => {
    if (!url || isImage) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const pdfjsLib = await loadPdfJs();

      const loadingTask = pdfjsLib.getDocument({
        url,
        withCredentials: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('[ParticipationDocViewer] Error loading PDF:', err);
      const message = err?.message || 'Failed to load PDF preview';
      setLoadError(message);
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, isImage, onError]);

  useEffect(() => {
    if ((isMobile || forceCustomViewer) && url && !isImage) {
      loadPdfDocument();
    }
  }, [isMobile, forceCustomViewer, url, isImage, loadPdfDocument]);

  // Cancel any running render task for a page
  const cancelRenderTask = (tasksMap: Map<number, any>, pageNumber: number) => {
    if (tasksMap.has(pageNumber)) {
      try {
        const task = tasksMap.get(pageNumber);
        task.cancel();
      } catch {
        // ignore cancellation errors
      }
      tasksMap.delete(pageNumber);
    }
  };

  // Render a specific page onto a canvas
  const renderPage = useCallback(
    async (
      pageNumber: number, 
      canvas: HTMLCanvasElement, 
      containerWidth: number,
      tasksMap: Map<number, any>
    ) => {
      if (!pdfDoc) return;

      cancelRenderTask(tasksMap, pageNumber);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate responsive fit scale based on container width
        const availableWidth = Math.max(containerWidth - 16, 260);
        const baseFitScale = availableWidth / unscaledViewport.width;
        const finalScale = baseFitScale * zoomLevel;

        const viewport = page.getViewport({ scale: finalScale });
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        };

        const renderTask = page.render(renderContext);
        tasksMap.set(pageNumber, renderTask);

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`[ParticipationDocViewer] Render error on page ${pageNumber}:`, err);
        }
      } finally {
        tasksMap.delete(pageNumber);
      }
    },
    [pdfDoc, zoomLevel]
  );

  // Render pages for compact view
  useEffect(() => {
    if (!pdfDoc || !scrollContainerRef.current || isFullScreen) return;

    const containerWidth = scrollContainerRef.current.clientWidth || 360;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageEl = pageRefs.current[pageNum - 1];
      if (pageEl) {
        const canvas = pageEl.querySelector('canvas');
        if (canvas) {
          renderPage(pageNum, canvas, containerWidth, renderTasksRef.current);
        }
      }
    }

    return () => {
      renderTasksRef.current.forEach((task) => {
        try { task.cancel(); } catch { /* ignore */ }
      });
      renderTasksRef.current.clear();
    };
  }, [pdfDoc, numPages, zoomLevel, isFullScreen, renderPage]);

  // Render pages for full-screen view
  useEffect(() => {
    if (!pdfDoc || !isFullScreen || !fullScreenScrollContainerRef.current) return;

    const containerWidth = fullScreenScrollContainerRef.current.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360);

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageEl = fullScreenPageRefs.current[pageNum - 1];
      if (pageEl) {
        const canvas = pageEl.querySelector('canvas');
        if (canvas) {
          renderPage(pageNum, canvas, containerWidth, fullScreenRenderTasksRef.current);
        }
      }
    }

    return () => {
      fullScreenRenderTasksRef.current.forEach((task) => {
        try { task.cancel(); } catch { /* ignore */ }
      });
      fullScreenRenderTasksRef.current.clear();
    };
  }, [pdfDoc, numPages, zoomLevel, isFullScreen, renderPage]);

  // Track currently visible page on scroll
  const handleScroll = (container: HTMLDivElement | null, refs: (HTMLDivElement | null)[]) => {
    if (!container || numPages <= 1) return;
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    for (let i = 0; i < refs.length; i++) {
      const pageEl = refs[i];
      if (pageEl) {
        const elTop = pageEl.offsetTop - container.offsetTop;
        const elBottom = elTop + pageEl.offsetHeight;
        if (elTop <= containerTop + containerHeight / 2 && elBottom >= containerTop) {
          setCurrentPage(i + 1);
          break;
        }
      }
    }
  };

  // Scroll to a specific page
  const scrollToPage = (pageNum: number, container: HTMLDivElement | null, refs: (HTMLDivElement | null)[]) => {
    const target = refs[pageNum - 1];
    if (target && container) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.6));
  };

  const handleZoomReset = () => {
    setZoomLevel(1.0);
  };

  // Full-screen expand and collapse handlers
  const handleExpand = () => {
    setIsFullScreen(true);
  };

  const handleCollapse = () => {
    setIsFullScreen(false);
  };

  // If no URL is provided, do not render anything
  if (!url) return null;

  // Moderately larger container height on desktop (sm:h-[44rem] md:h-[48rem]), compact on mobile (h-[21rem])
  const containerHeightClass = fillContainer ? 'h-full' : 'h-[21rem] sm:h-[44rem] md:h-[48rem]';

  // Desktop native preview:
  // Render exact existing iframe when on desktop and not forced to custom viewer
  if (isMounted && !isMobile && !forceCustomViewer) {
    return (
      <div data-testid="desktop-pdf-viewer" className={`w-full relative flex flex-col ${containerHeightClass} ${className}`}>
        {isImage ? (
          <div className="w-full h-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-center p-4 overflow-auto">
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full object-contain rounded shadow-sm"
            />
          </div>
        ) : (
          <iframe
            src={`${url}#toolbar=0`}
            title={title}
            className="w-full h-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)]"
            onError={() => {
              setForceCustomViewer(true);
              if (onError) onError();
            }}
          />
        )}
        {/* Subtle toggle for desktop users if their browser has an issue with native embedding */}
        {!isImage && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setForceCustomViewer(true)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              Trouble viewing? Switch to built-in reader
            </button>
          </div>
        )}
      </div>
    );
  }

  // Mobile / In-Browser Responsive Viewer
  return (
    <>
      {/* ── Compact Inline Viewer (Preserves In-Page Flow) ───────────────── */}
      <div
        ref={containerRef}
        data-testid="mobile-pdf-viewer"
        className={`w-full flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] overflow-hidden ${containerHeightClass} ${className}`}
      >
        {/* Mobile Expansion Prompt Header */}
        {!fillContainer && isMobile && (
          <button
            type="button"
            onClick={handleExpand}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-[var(--border-subtle)] text-[rgb(var(--color-primary))] text-xs font-semibold hover:brightness-95 transition-all group shrink-0 active:bg-blue-100/70"
            aria-label="Open document in full-screen view"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] group-hover:scale-105 transition-transform">
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
              <span>Open Full Screen</span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-normal group-hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              Tap to expand <Maximize2 className="w-3 h-3" />
            </span>
          </button>
        )}

        {/* Compact Viewer Toolbar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-[var(--border-subtle)] shrink-0 z-10">
          {/* Page navigation */}
          {!isImage ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => scrollToPage(currentPage - 1, scrollContainerRef.current, pageRefs.current)}
                aria-label="Previous Page"
                className="p-1 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-[var(--text-secondary)] select-none">
                {isLoading ? '...' : numPages > 0 ? `${currentPage} / ${numPages}` : '1 / 1'}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages || isLoading}
                onClick={() => scrollToPage(currentPage + 1, scrollContainerRef.current, pageRefs.current)}
                aria-label="Next Page"
                className="p-1 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-[var(--text-secondary)]">Image Preview</span>
          )}

          {/* Zoom controls & Expand Icon */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isLoading || zoomLevel <= 0.6}
              onClick={handleZoomOut}
              aria-label="Zoom Out"
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleZoomReset}
              aria-label="Reset Zoom"
              title="Reset Zoom"
              className="px-1.5 py-0.5 text-[11px] font-semibold rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            <button
              type="button"
              disabled={isLoading || zoomLevel >= 2.5}
              onClick={handleZoomIn}
              aria-label="Zoom In"
              title="Zoom In"
              className="p-1.5 rounded hover:bg-[var(--surface-subtle)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {!fillContainer && isMobile && (
              <button
                type="button"
                onClick={handleExpand}
                aria-label="Expand document to full screen"
                title="Open Full Screen"
                className="ml-1 p-1.5 rounded-lg bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/20 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop switch-back option if forced */}
            {!isMobile && forceCustomViewer && (
              <button
                type="button"
                onClick={() => setForceCustomViewer(false)}
                className="ml-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
              >
                Native view
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Document Viewing Area (Compact) */}
        <div
          ref={scrollContainerRef}
          data-testid="pdf-scroll-container"
          onClick={() => {
            if (!fillContainer && isMobile) handleExpand();
          }}
          onScroll={() => handleScroll(scrollContainerRef.current, pageRefs.current)}
          className={`flex-1 w-full overflow-y-auto overflow-x-auto p-3 flex flex-col items-center gap-3 scroll-smooth ${
            !fillContainer && isMobile ? 'cursor-pointer' : ''
          }`}
        >
          {isImage ? (
            <div className="flex-1 w-full flex items-center justify-center p-2">
              <img
                src={url}
                alt={title}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="max-w-full h-auto object-contain rounded shadow-sm transition-transform"
              />
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center p-4">
                  <Loader2 className="w-7 h-7 text-[rgb(var(--color-primary))] animate-spin mb-2" />
                  <p className="text-xs font-medium text-[var(--text-primary)]">Loading document...</p>
                </div>
              )}

              {loadError && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Preview unavailable</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-xs">{loadError}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPdfDocument();
                      }}
                      className="btn-secondary text-[11px] px-2.5 py-1"
                    >
                      Retry
                    </button>
                    <a
                      href={url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="btn-primary text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </div>
              )}

              {!isLoading && !loadError && numPages > 0 && (
                Array.from({ length: numPages }).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div
                      key={`pdf-page-${pageNum}`}
                      ref={(el) => {
                        pageRefs.current[index] = el;
                      }}
                      className="flex flex-col items-center max-w-full"
                    >
                      <div className="relative shadow-sm rounded-sm bg-white overflow-hidden max-w-full">
                        <canvas className="block max-w-full h-auto" />
                      </div>
                      {numPages > 1 && (
                        <span className="text-[9px] text-[var(--text-muted)] mt-1 select-none font-medium">
                          Page {pageNum} of {numPages}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* ── True Full-Screen Mobile PDF Viewer ─────────────────────────────── */}
      {!fillContainer && isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden pt-[max(env(safe-area-inset-top),0.25rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] animate-in fade-in zoom-in-[0.99] duration-150"
        >
          {/* ── Simplified Compact Toolbar (No Titles, No Redundant Text) ── */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--border-subtle)] bg-white dark:bg-zinc-900 shrink-0 z-20 gap-2">
            {/* 1. Page Navigation (Previous, 1/10, Next) */}
            {!isImage ? (
              <div className="flex items-center bg-[var(--surface-subtle)] rounded-lg p-0.5 border border-[var(--border-subtle)] shrink-0">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => scrollToPage(currentPage - 1, fullScreenScrollContainerRef.current, fullScreenPageRefs.current)}
                  aria-label="Previous Page"
                  className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1.5 text-xs font-semibold text-[var(--text-secondary)] select-none tabular-nums min-w-[36px] text-center">
                  {isLoading ? '...' : numPages > 0 ? `${currentPage}/${numPages}` : '1/1'}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages || isLoading}
                  onClick={() => scrollToPage(currentPage + 1, fullScreenScrollContainerRef.current, fullScreenPageRefs.current)}
                  aria-label="Next Page"
                  className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-[var(--text-secondary)] px-1">
                Image
              </div>
            )}

            {/* 2. Zoom Controls (Zoom Out, %, Zoom In) */}
            <div className="flex items-center bg-[var(--surface-subtle)] rounded-lg p-0.5 border border-[var(--border-subtle)] shrink-0">
              <button
                type="button"
                disabled={zoomLevel <= 0.6 || isLoading}
                onClick={handleZoomOut}
                aria-label="Zoom Out"
                className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 text-[var(--text-secondary)] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                aria-label="Reset Zoom"
                title="Reset Zoom"
                className="px-1.5 text-xs font-semibold text-[var(--text-secondary)] select-none tabular-nums hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                disabled={zoomLevel >= 2.5 || isLoading}
                onClick={handleZoomIn}
                aria-label="Zoom In"
                className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 text-[var(--text-secondary)] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Action Buttons: Download & Done */}
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={url}
                download
                aria-label="Download Document"
                title="Download Document"
                className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--card-border)] text-[var(--text-secondary)] transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleCollapse}
                aria-label="Close full-screen viewer"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[rgb(var(--color-primary))] text-white text-xs font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs"
              >
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* ── Maximize PDF Readable Area Directly Below Toolbar ──────────── */}
          <div
            ref={fullScreenScrollContainerRef}
            data-testid="fullscreen-pdf-scroll-container"
            onScroll={() => handleScroll(fullScreenScrollContainerRef.current, fullScreenPageRefs.current)}
            className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto p-1.5 sm:p-2 flex flex-col items-center gap-2 overscroll-contain scroll-smooth bg-zinc-100 dark:bg-zinc-950"
          >
            {isImage ? (
              <div className="flex-1 w-full flex items-center justify-center p-2">
                <img
                  src={url}
                  alt={title}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="max-w-full h-auto object-contain rounded shadow transition-transform"
                />
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
                    <Loader2 className="w-8 h-8 text-[rgb(var(--color-primary))] animate-spin mb-2" />
                    <p className="text-xs font-medium text-[var(--text-primary)]">Loading document...</p>
                  </div>
                )}

                {loadError && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-2">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Preview unavailable</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-xs">{loadError}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={loadPdfDocument}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Retry
                      </button>
                      <a
                        href={url}
                        download
                        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                )}

                {!isLoading && !loadError && numPages > 0 && (
                  Array.from({ length: numPages }).map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <div
                        key={`fullscreen-pdf-page-${pageNum}`}
                        ref={(el) => {
                          fullScreenPageRefs.current[index] = el;
                        }}
                        className="flex flex-col items-center max-w-full"
                      >
                        <div className="relative shadow rounded-sm bg-white overflow-hidden max-w-full">
                          <canvas className="block max-w-full h-auto" />
                        </div>
                        {numPages > 1 && (
                          <span className="text-[9px] text-[var(--text-muted)] mt-0.5 select-none font-medium">
                            {pageNum} / {numPages}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
