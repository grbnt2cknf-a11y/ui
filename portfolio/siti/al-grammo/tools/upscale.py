import sys, cv2
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel("/tmp/claude-0/sr/EDSR_x2.pb"); sr.setModel("edsr", 2)
for n in sys.argv[2:]:
    img = cv2.imread(f"{sys.argv[1]}/src/{n}.jpg")
    cv2.imwrite(f"{sys.argv[1]}/out/{n}_x2.png", sr.upsample(img)); print(n, "done", flush=True)
